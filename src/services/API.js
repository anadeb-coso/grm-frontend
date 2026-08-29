import { grmBaseURL } from '../services/env';
import { ensureRequestAllowed, api, rootApi } from '../api/client';

const baseURL = grmBaseURL;


export { baseURL };
export function handleErrors(response) {
  if (response.non_field_errors) {
    setTimeout(() => alert(response.non_field_errors[0]), 1000);
    throw Error(response.non_field_errors[0]);
  }
  return response;
}

class API {
  async signUp(data) {
    // `requireAuth: false` : signUp est lui-même un endpoint pré-authentification, seul l'accès
    // réseau est vérifié ici (cf. api/client.js::ensureRequestAllowed).
    try {
      await ensureRequestAllowed({ requireAuth: false });
    } catch (error) {
      return { error };
    }
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
    };
    const result = fetch(`${baseURL}/authentication/register/`, requestOptions)
      .then((response) => response.json())
      .then(handleErrors)
      .then((response) => response)
      .catch((error) => ({ error }));
    return result;
  }

  // Profil ADL (village/commune géré) de l'utilisateur authentifié — remplace l'ancien
  // `login(email, password)` qui renvoyait à `/authentication/obtain-auth-credentials/` : ce
  // dernier obligeait l'app à conserver le mot de passe en clair en mémoire/stockage pour pouvoir
  // rafraîchir ce profil à chaque écran (cf. databaseManager.js::getUserDocs). `rootApi` attache
  // déjà le token JWT courant (avec refresh automatique en cas d'expiration, src/api/client.js) —
  // aucun identifiant à transmettre ici.
  async getMyProfile() {
    try {
      const { data } = await rootApi.get('/authentication/me/');
      return data;
    } catch (error) {
      return { error };
    }
  }


  async administrativeLevelsFilterByAdministrativeRegion(username, administrative_region, filter) {
    try {
      await ensureRequestAllowed();
    } catch (error) {
      return { error };
    }
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    let d = "";
    for (var [key, value] of Object.entries(filter)) {
      d += "&" + key + "=" + value;
    }
    const requestOptions = {
      method: 'GET',
      headers: myHeaders
    };
    const result = fetch(`${baseURL}/administrative-levels/filter-by-administrative-region/?email=${username}&administrative_region=${administrative_region}${d}`, requestOptions)
      .then((response) => response.json())
      .then(handleErrors)
      .then((response) => response)
      .catch((error) => ({ error }));
    return result;
  }


  // `/issue/save-issue-datas/` exige désormais un token JWT valide côté Django (permission_classes
  // = (IsAuthenticated,), cf. grm-backend/src/issue/views_rest.py::SaveIssueDatas) — auparavant
  // ouvert, l'identité de l'appelant ne reposait que sur l'`email` transmis dans le corps, sans
  // aucune vérification. On passe donc par `api` (plutôt qu'un `fetch()` sans en-tête
  // `Authorization`) : il attache le token courant et le rafraîchit automatiquement en cas
  // d'expiration (interceptor, cf. api/client.js), même patron que `getMyProfile` ci-dessus.
  // `email` reste transmis : le serializer côté Django s'en sert toujours pour résoudre le
  // `user_id` associé aux issues du payload (reporter/assignee), logique inchangée par ce correctif.
  async sync_datas(data, language='fr') {
    try {
      const { data: result } = await api.post('/issue/save-issue-datas/', data, {
        headers: { 'Accept-Language': language },
      });
      return result;
    } catch (error) {
      return { error };
    }
  }


  // Même raisonnement que `sync_datas` ci-dessus : `/issue/check-sync-issues/` exige désormais un
  // token JWT valide.
  async check_sync_issues(data, language='fr') {
    try {
      const { data: result } = await api.post('/issue/check-sync-issues/', data, {
        headers: { 'Accept-Language': language },
      });
      return result;
    } catch (error) {
      return { error };
    }
  }

}
export default API;
