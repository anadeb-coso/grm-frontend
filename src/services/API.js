// const baseURL = 'http://197.243.104.5/webapp';
// const baseURL = 'http://drdip.e3grm.org';
const baseURL = 'http://grm-2-env.eba-speiyafz.us-west-1.elasticbeanstalk.com';
// const baseURL = 'http://10.0.2.2:8002';
export { baseURL };
function handleErrors(response) {
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
    // console.log(username);
    // console.log(baseURL)
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


  async sync_datas(data) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
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
}
export default API;
