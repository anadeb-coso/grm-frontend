import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart,
} from "react-native-chart-kit";

import { View, Text, Dimensions, StyleSheet } from 'react-native';


const BarChartIssues = ({ issues }) => {
    const { t } = useTranslation();

    const screenWidth = Dimensions.get("window").width;

    const chartConfigBar = {
        backgroundGradientFrom: 'gray',
        // backgroundGradientFromOpacity: 0,
        backgroundGradientTo: 'white',
        // backgroundGradientToOpacity: 0.5,
        color: (opacity = 1) => 'black',
        labelColor: () => '#6a6a6a',
        strokeWidth: 2,
        //   barPercentage: 0.5,

    };

    const _dataBar = [0, 0, 0, 0];
    for (const issue of issues) {
        if(issue.status.id === 1){//Enregistrée
            _dataBar[0]++;
        }else if(issue.status.id === 2){//En cours de traitement
            _dataBar[1]++;
        }else if(issue.status.id === 3){//Résoluée
            _dataBar[2]++;
        }else if(issue.status.id === 5){//En cours de traitement
            _dataBar[3]++;
        }
    }


    const dataBar = {
        labels: ["Enregistrée", "En cours", "Non Résolue", "Résolue"],
        datasets: [
            {
                data: _dataBar,
                colors: [(opacity = 1) => `rgba(255, 0, 0, ${opacity})`],
            }
        ]
    };

    return (
        <>
            <View>
                <Text>{t('status_label')}</Text>
                <View style={styles.container}>
                    <BarChart
                        style={styles.chart}
                        data={dataBar}
                        width={screenWidth}
                        height={270}
                        chartConfig={chartConfigBar}
                        verticalLabelRotation={30}
                    />
                </View>
            </View>
        </>

    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
});

export default BarChartIssues;