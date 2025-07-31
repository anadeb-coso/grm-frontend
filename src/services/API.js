import { grmBaseURL } from '../services/env';

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

  async login(data) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
    };
    const result = fetch(`${baseURL}/authentication/obtain-auth-credentials/`, requestOptions)
      .then((response) => response.json())
      .then(handleErrors)
      .then((a) => a)
      .catch((error) => ({ error }));
    return result;
  }


  async administrativeLevelsFilterByAdministrativeRegion(username, administrative_region, filter) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    d = ""
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


  async sync_datas(data, language='fr') {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Accept-Language', language);
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
    };
    const result = fetch(
      `${baseURL}/issue/save-issue-datas/`,
      requestOptions,
    )
      .then(response => response.json())
      .then(handleErrors)
      .then(a => a)
      .catch(error => ({ error }));
    return result;
  }


  
  async check_sync_issues(data, language='fr') {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Accept-Language', language);
    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
    };
    const result = fetch(
      `${baseURL}/issue/check-sync-issues/`,
      requestOptions,
    )
      .then(response => response.json())
      .then(handleErrors)
      .then(a => a)
      .catch(error => ({ error }));
    return result;
  }

}
export default API;
