// Indexé par `citizen_type`, comme CITIZEN_TYPE_CHOICES_ALT côté web (grm-backend/src/dashboard/
// grm/__init__.py) : 0/1 = plaignant (1 = nom confidentiel), 2 = particulier pour le compte
// d'autrui, 3 = organisation pour le compte d'autrui.
export const citizenTypes = [
    "Complainant",
    "Complainant",
    "Citizen on behalf of others",
    "Organization on behalf of others"
]

export const administrative_levels = [
    "Country", "Region", "Prefecture", "Canton", "Village"
] // Level complaint

export const id_kara_centrale_cantons = [
    1928, 1921, 1939, 1952
]

export const name_kara_centrale_cantons = [
    "KABOLI", "BALANKA", "PAGOUDA", "KETAO"
]

export const VERY_SENSITIVE = "Very_sensitive";