import React, { useEffect, useState } from "react";
import { SafeAreaView, ActivityIndicator } from "react-native";
import { Q } from "@nozbe/watermelondb";
import Content from "./containers/Content";
import { styles } from "./ParticipatoryBudgetingList.styles";
import { database } from "../../../database";
import { getCurrentUserId } from "../../../api/client";
import { useSelector } from "react-redux";
import { colors } from "../../../utils/colors";

const ParticipatoryBudgetingList = () => {
  const customStyles = styles();
  const [loading, setLoading] = useState(true);
  const [eadl, setEadl] = useState();
  const { username } = useSelector((state) => {
    return state.get("authentication").toObject();
  });
  useEffect(() => {
    if (username) {
      (async () => {
        try {
          const userId = await getCurrentUserId();
          const adls = await database.get('adls').query(Q.where('representative', userId)).fetch();
          setEadl(adls[0]);
        } catch (err) {
          console.log(err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [username]);
  // console.log(phases);
  return (
    <SafeAreaView style={customStyles.container}>
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 50 }}
          color={colors.primary}
          size={"large"}
        />
      ) : (
        <Content eadl={eadl} />
      )}
    </SafeAreaView>
  );
};
export default ParticipatoryBudgetingList;
