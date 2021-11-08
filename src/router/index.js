import React, { useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import PrivateRoutes from "./privateRoutes";
import PublicRoutes from "./publicRoutes";
import { useDispatch, useSelector } from "react-redux";
import { View } from "react-native";
import { getEncryptedData } from "../utils/storageManager";
import { init } from "../store/ducks/authentication.duck";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
  Poppins_400Regular_Italic,
  useFonts,
} from "@expo-google-fonts/poppins";

const Router = ({ theme }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const { userPassword } = useSelector((state) => {
    return state.get("authentication").toObject();
  });

  const getDBConfig = async () => {
    const password = await getEncryptedData("userPassword");
    let dbCredentials;
    let username;
    if (password) {
      username = await getEncryptedData(`username`);
      dbCredentials = await getEncryptedData(
        `dbCredentials_${password}_${username.replace("@", "")}`
      );
      dispatch(init(dbCredentials, { password, email: username }));
    }
    setLoading(false);
  };

  useEffect(() => {
    getDBConfig();
  }, []);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    Poppins_400Regular_Italic,
  });

  if (loading || !fontsLoaded) return <View />;

  return (
    <NavigationContainer theme={theme || DefaultTheme}>
      {userPassword ? <PrivateRoutes /> : <PublicRoutes />}
    </NavigationContainer>
  );
};

export default Router;
