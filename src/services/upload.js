import { Platform } from 'react-native';
import axios from 'axios';

import { handleErrors } from './API';

export async function uploadFile(
    url,
    data
) {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'multipart/form-data');
    
    data.url = data?.url ?? (data?.uri ?? data?.local_url);

    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
        formData.append(`${key}`, value);
    }
    formData.append('file', {
        uri:
            Platform.OS === 'android'
                ? data?.url
                : data?.url.replace('file://', ''),
        name: `${data?.url.split('/')[data?.url.split('/').length - 1]}`,
        type: data?.mimeType ? data?.mimeType : (data?.isAudio ? 'audio/m4a' : ((data?.url.includes('.pdf') || data?.url.includes('.doc')) ? 'application/pdf' : 'image/*')), //'image/jpeg' // it may be necessary in Android.
    });


    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: formData,
    };

    const result = fetch(
        url,
        requestOptions,
    )
        .then(response => response.json())
        .then(handleErrors)
        .then(a => a)
        .catch(error => ({ error }));

    return result;
}


// export async function uploadFileAxios(url, data) {

//     data?.url = data?.url ?? (data?.uri ?? data?.local_url);

//     const formData = new FormData();
//     for (const [key, value] of Object.entries(data)) {
//         formData.append(`${key}`, value);
//     }

//     formData.append('file', {
//         uri: Platform.OS === 'android' ? data?.url : data?.url.replace('file://', ''),
//         name: data?.url.split('/').pop(),
//         type: data?.url.includes('.pdf') ? 'application/pdf' : 'image/*',
//     });

//     try {
//         const response = await axios.post(url, formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data',
//             },
//         });

//         const result = await handleErrors(response.data);
//         return result;
//     } catch (error) {
//         return { error };
//     }
// }