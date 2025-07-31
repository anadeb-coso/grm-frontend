import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    PieChart,
} from "react-native-chart-kit";

import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { categories_colors } from '../../utils/colors';


const PieChartIssues = ({ issues }) => {
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

    const data = [];
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


    }


    return (
        <>
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

export default PieChartIssues;