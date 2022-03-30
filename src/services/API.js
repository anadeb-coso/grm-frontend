
const baseURL = "https://grm-6u3m7.ondigitalocean.app";
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
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(data),
    };
    var result = fetch(`${baseURL}/authentication/register/`, requestOptions)
      .then((response) => response.json())
      .then(handleErrors)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        return { error };
      });
    return result;
  }

  async login(data) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(data),
    };
    var result = fetch(
      `${baseURL}/authentication/obtain-auth-credentials/`,
      requestOptions
    )
      .then((response) => response.json())
      .then(handleErrors)
      .then((a) => {
        return a;
      })
      .catch((error) => {
        return { error };
      });
    return result;
  }
}
export default API;
