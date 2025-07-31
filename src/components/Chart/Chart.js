import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    LineChart,
    BarChart,
    PieChart,
    ProgressChart,
    ContributionGraph,
    StackedBarChart
} from "react-native-chart-kit";

import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { categories_colors } from '../../utils/colors';


const ChartIssues = ({ issues }) => {
    const { t } = useTranslation();

    const screenWidth = Dimensions.get("window").width;
    const chartConfig = {
        backgroundGradientFrom: "#1E2923",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#08130D",
        backgroundGradientToOpacity: 0.5,
        color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false // optional
    };

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

    const data = [];
    const _dataBar = [0, 0, 0, 0];
    let index;
    for (const issue of issues) {
        index = data.findIndex(item => item.id === issue.category.id);
        if (index < 0) {
            data.push(
                {
                    id: issue.category.id,
                    name: issue.category.name,
                    number_issues: 1,
                    color: categories_colors[issue.category.id],
                    legendFontColor: "#7F7F7F",
                    legendFontSize: 11
                }
            )
        } else {
            data[index].number_issues++;
        }



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

            <View>
                <Text>{t('category_label')}</Text>
                <PieChart
                    data={data}
                    width={screenWidth}
                    height={320}
                    chartConfig={chartConfig}
                    accessor={"number_issues"}
                    backgroundColor={"transparent"}
                    //   paddingLeft={"15"}
                    center={[50, 0]}
                    //   hasLegend={false}
                    absolute
                    style={styles.chart}
                />
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

export default ChartIssues;