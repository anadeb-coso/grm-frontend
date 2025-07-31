import { cddBaseURL } from '../env'
import { handleErrors } from '../API';

class StoreProjectsAPI {

  async get_storeprojects(
    page,
    page_size
  ) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const requestOptions = {
      method: 'POST',
      headers: myHeaders
    };
    const result = fetch(
      `${cddBaseURL}/api/storeapp/get-store-projects/?${page ? 'page=' + page : ''}&${page_size ? 'page_size=' + page_size : ''}`,
      requestOptions,
    )
      .then(response => response.json())
      .then(handleErrors)
      .then(a => a)
      .catch(error => ({ error }));
    return result;
  }

  
  async get_storeproject_by_package(
    app_package
  ) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const requestOptions = {
      method: 'POST',
      headers: myHeaders
    };
    const result = fetch(
      `${cddBaseURL}/api/storeapp/get-store-project-by-package/${app_package}/`,
      requestOptions,
    )
      .then(response => response.json())
      .then(handleErrors)
      .then(a => a)
      .catch(error => ({ error }));
    return result;
  }


}

export default StoreProjectsAPI;