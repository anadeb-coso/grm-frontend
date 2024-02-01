import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { couchDBURLBase } from '../utils/databaseManager';

export const verify_account_on_couchdb = async (dbCredentials, user_email) => {
    let isConnected = true;
    await NetInfo.fetch().then((state) => {
        isConnected = state.isConnected;
    });

    if (isConnected) {
        try {
            var response = await axios.get(`${couchDBURLBase}/eadls/_design/eadl/_view/by_email`,
                {
                    params: {
                        key: JSON.stringify(user_email),
                        include_docs: true
                    },
                    auth: {
                        username: dbCredentials.username,
                        password: dbCredentials.password
                    }
                }
            );
            
            if(response.data && response.data.rows && response.data.rows.length != 0 && response.data.rows[0].value.representative && response.data.rows[0].value.representative.is_active){
                return true;
            }
        } catch (error) {
            console.log("post failed\n", error)
            console.log(error)
            return true;
        }
    }else{
        return true;
    }
    
    return false;
}







// const query = {
//   selector: {
//     'representative.email': 'anadebgrm@gmail.com'
//   }
// };
// axios.post(`${couchDBURLBase}/eadls/_find`, query, {
//   headers: {
//     'Content-Type': 'application/json'
//   },
//   auth: {
//       username: dbCredentials.username,
//       password: dbCredentials.password
//     }
// })
//   .then(response => {
//     console.log("response.data");
//     console.log(response.data);
//   })
//   .catch(error => {
//     console.error('Error:', error);
//   });