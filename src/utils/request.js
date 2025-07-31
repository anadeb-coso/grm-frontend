// request.js
import axios from "axios";
import { getData } from "./storageManager";

// optionaly add base url
const client = axios.create({ baseUrl: "http://someapi.com/api" });

const request = ({ ...options }) => {
  client.defaults.headers.common.Authorization = `Token ${getData("token")}`;

  const onSuccess = (response) => response;
  const onError = (error) => {
    // optionaly catch errors and add some additional logging here
    return error;
  };

  return client(options).then(onSuccess).catch(onError);
};

export default request;

// then you could wrap request (maybe besides /login if you don't want token there):
//
// const getTodos = () => request({
//     url: '/todos',
// });
// Having this you can use react-query as usual:
//
//     const { data } = useQuery('todos', async () => {
//         const response = await getTodos();
//         return response;
//     })

// otherwise just as normal axios.get('http://someapi.com/api/todos', { headers: { Authorization: `Bearer ${token}`})
