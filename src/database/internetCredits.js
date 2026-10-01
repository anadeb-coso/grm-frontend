import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { database } from './index';
import { INTERNET_CREDIT_TABLE_NAMES } from './schema';
import { getCurrentUserId } from '../api/client';
import { uuidv4 } from './utils/uuid';

export const ROLE_CVGP = 'cvgp';
export const ROLE_FC = 'fc';

/**
 * Notifications de forfait internet CVGP de l'utilisateur connecté, calculées à partir de la base
 * locale (fonctionne hors-ligne). Mêmes règles que le serveur
 * (grm-backend/src/internet_credits/services.py::is_pending_for) :
 * - membre CVGP (sa propre ligne) : visible tant qu'il n'a pas confirmé ;
 * - FC/AC (lignes des CVD de son périmètre, filtrées par le serveur au pull) : visible tant que
 *   les deux confirmations (CVGP + au moins un FC/AC) n'existent pas.
 */
export async function loadInternetCreditNotifications(userId) {
  const notDeleted = Q.where('is_deleted', false);
  const [campaigns, beneficiaries, confirmations] = await Promise.all([
    database.get('internet_credit_campaigns').query(notDeleted).fetch(),
    database.get('internet_credit_beneficiaries').query(notDeleted).fetch(),
    database.get('internet_credit_confirmations').query(notDeleted).fetch(),
  ]);

  const campaignById = new Map(campaigns.map((c) => [c.id, c]));
  const confirmationsByBeneficiary = new Map();
  confirmations.forEach((c) => {
    const list = confirmationsByBeneficiary.get(c.beneficiaryId) || [];
    list.push(c);
    confirmationsByBeneficiary.set(c.beneficiaryId, list);
  });

  const notifications = [];
  beneficiaries.forEach((beneficiary) => {
    const campaign = campaignById.get(beneficiary.campaignId);
    if (!campaign) return;
    const role = String(beneficiary.cvgpMemberId) === String(userId) ? ROLE_CVGP : ROLE_FC;
    const lineConfirmations = confirmationsByBeneficiary.get(beneficiary.id) || [];
    const cvgpConfirmation = lineConfirmations.find((c) => c.role === ROLE_CVGP) || null;
    const fcConfirmations = lineConfirmations.filter((c) => c.role === ROLE_FC);
    const myConfirmation = lineConfirmations.find(
      (c) => c.role === role && String(c.confirmedById) === String(userId)
    ) || null;

    const pending = role === ROLE_CVGP
      ? !cvgpConfirmation
      : !(cvgpConfirmation && fcConfirmations.length);
    if (!pending) return;

    notifications.push({
      id: beneficiary.id,
      role,
      beneficiary,
      campaign,
      message: role === ROLE_CVGP ? beneficiary.cvgpMessage : beneficiary.fcMessage,
      cvgpConfirmation,
      fcConfirmations,
      myConfirmation,
    });
  });

  return notifications.sort(
    (a, b) => (b.campaign.period?.getTime?.() || 0) - (a.campaign.period?.getTime?.() || 0)
      || (a.beneficiary.cvdName || '').localeCompare(b.beneficiary.cvdName || '')
  );
}

/** Liste observée : se met à jour à chaque changement des tables du forfait (pull, confirmation). */
export function useInternetCreditNotifications() {
  const [state, setState] = useState({ loading: true, items: [] });

  useEffect(() => {
    let active = true;
    const reload = async () => {
      try {
        const userId = await getCurrentUserId();
        const items = userId ? await loadInternetCreditNotifications(userId) : [];
        if (active) setState({ loading: false, items });
      } catch (err) {
        if (__DEV__) console.warn('[internetCredits] chargement des notifications impossible', err);
        if (active) setState((s) => ({ ...s, loading: false }));
      }
    };
    reload();
    const subscription = database.withChangesForTables(INTERNET_CREDIT_TABLE_NAMES).subscribe(() => reload());
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Enregistre localement la confirmation (hors-ligne possible) ; elle part au serveur au prochain
 * push, qui revérifie le rôle et le périmètre (`internet_credits.services.create_confirmation`).
 * L'id est un UUID v4 repris tel quel par le serveur (cf. database/utils/createWithId.js).
 */
export async function createInternetCreditConfirmation({ notification, userId, signature, description }) {
  const collection = database.get('internet_credit_confirmations');
  return database.write(async () => collection.create((record) => {
    record._raw.id = uuidv4();
    record.beneficiaryId = notification.beneficiary.id;
    record.role = notification.role;
    record.confirmedById = Number(userId);
    record.message = notification.message;
    record.checked = true;
    record.signature = signature;
    record.hasSignature = true;
    record.description = description?.trim() || null;
    record.confirmedAt = new Date();
    record.source = 'grm_mobile';
    record.isDeleted = false;
  }));
}
