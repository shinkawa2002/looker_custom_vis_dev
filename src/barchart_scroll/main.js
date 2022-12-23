// dependecies
//https://code.highcharts.com/stock/highstock.js
//https://code.highcharts.com/modules/accessibility.js

import * as Highcharts from "highcharts/highstock"
import "highcharts/modules/accessibility"
import { CustomUtil, ColorPallet } from "./util"
import { options } from "./options"

const modifyOptions = (vis, config, data) => {
    let optionChanged = false
    // dynamically change based on Series Positioning
    if (config.series_positioning === "s") {
        if (!options['total_value_label']) {
            options['total_value_label'] = {
                type: 'boolean',
                label: 'Total Value Labels',
                section: 'Values',
                default: config['total_value_label'] ? config['total_value_label']: false,
                order: 21
            }
            optionChanged = true
        }
    } else if (options['total_value_label']) {
        delete options['total_value_label']
        optionChanged = true
    }

    // color change
    const optionKeys = Object.keys(options)
    const colorKeys = optionKeys.filter (key => {
        return key.startsWith('color_')
    })

    // add Color config
    const needCl = []
    const updateConfigs = []
    data.forEach((d,idx) => {
        const {key_id, name} = d
        const cl = `color_${key_id}`
        if (!options[cl]) {
            const defColor = config[cl] ? config[cl] : ColorPallet["BoardWalk"][idx]
            options[cl]= {
                type: 'array',
                label: name,
                display: 'color',
                section: 'Series',
                default: [defColor],
                placeholder: defColor,
                order: 100 + idx
            }
            optionChanged = true
        }
        needCl.push(cl)
    })

    // remove color config for unused measure
    colorKeys.forEach(key => {
        if (!needCl.includes(key)) {
            delete options[key]
            optionChanged = true
        }
    })

    if (optionChanged) {
        vis.trigger('registerOptions', options)
    }

}

/*
* Custom Visualization main (see: https://github.com/looker-open-source/custom_visualizations_v2/blob/master/docs/api_reference.md)
*/
const visObject = {
    options: options,
    create: function(element, config) {
        element.innerHTML = `
        <style>
        #container {
            height: 100%;
            width: 100%;
        }
        </style>
        <div id="container"></div>
        `
    },
    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors()
        const container = document.getElementById("container")
        container.innerHTML=""

        // Only accept 1 dimension and 1 pivot, other than that, cause error
        if (!CustomUtil.handleErrors(this, queryResponse, {
            min_dimensions: 1, max_dimensions: 1,
            min_measures: 1, max_measures: Infinity,
            min_pivots: 0, max_pivots: 1
        })) return

        const {fields} = queryResponse
        const { dimension_like, measure_like} = fields

        const labels = []
        const labelFields = dimension_like[0].name
        const pivots = fields.pivots.map(d => d.name).filter(d => d !== "crossfilterSelection")

        // set up xAxis values
        data.forEach(col => {
            if (!labels.includes(col[labelFields].value)) 
                labels.push(col[labelFields].value)
        })

        // Gather pivot information
        const pivotSet = {}
        for (const pivot of pivots) {
            pivotSet[pivot] = true
        }
        const pivotLabels = []
        if (pivots.length > 0) {
            const row = data[0]
            for (const flatKey of Object.keys(row[measure_like[0].name])) {
                const pivotValues = flatKey.split(/\|FIELD\|/g)
                if (!details.crossfilterEnabled || pivotValues[0] !== "crossfilterSelection")
                    pivotLabels.push(pivotValues[0])
            }
        }

        // generate datasets
        const dimDatas = []
        const barDatas = []
        let colorIdx = 0
        measure_like.forEach((mes, idx) => {
            const mes_label = (config.show_full_field_name || !mes.label_short) ? mes.label : mes.label_short;
            if (pivots.length === 0) {
                barDatas.push({
                    name: mes_label,
                    key_id: mes.name,
                    data: new Array(labels.length),
                    links: new Array(labels.length),
                    rendered_values: new Array(labels.length),
                    color: config[`color_${mes.name}`] ? config[`color_${mes.name}`][0] : ColorPallet["BoardWalk"][colorIdx]
                })
                colorIdx++
            } else {
                pivotLabels.forEach((pivotName, pIdx) => {
                    const mes_label2 = pivotName + " - " + mes_label
                    const config_label = mes_label2.replaceAll(" ", "_")
                    barDatas.push({
                        name: mes_label2,
                        key_id: mes.name + '-' + pIdx,
                        data: new Array(labels.length),
                        links: new Array(labels.length),
                        rendered_values: new Array(labels.length),
                        color: config[`color_${mes.name}-${pIdx}`] ? config[`color_${mes.name}-${pIdx}`][0] : ColorPallet["BoardWalk"][colorIdx]
                    })
                    colorIdx++
                })
            }
        })

        // Modify Configuration Options based on selected measures
        modifyOptions(this, config, barDatas)

        // Set yAxis values for each dataset
        data.forEach((record, idx) => {
            // xAxis
            if (!dimDatas.includes(record[labelFields].rendered ? record[labelFields].rendered : record[labelFields].value)) {
                dimDatas.push(record[labelFields].rendered ? record[labelFields].rendered : record[labelFields].value);
            }

            // yAxis
            for (const mes of measure_like) {
                const mes_label = (config.show_full_field_name || !mes.label_short) ? mes.label : mes.label_short;
                if (pivots.length == 0) {
                    const label_name = mes_label
                    const index = barDatas.findIndex(d => d.name === label_name)
                    const rowIndex = labels.findIndex(d => d === record[labelFields].value)
                    if (index == -1) {
                        console.error("argumement is not decleared")
                    } else {
                        if (LookerCharts.Utils.getCrossfilterSelection(record) != 2) {
                            barDatas[index].data[rowIndex]= record[mes.name].value
                        } else {
                            barDatas[index].data[rowIndex]= {
                                y: record[mes.name].value,
                                color: "#DEE1E5"
                            }
                        }
                        barDatas[index].rendered_values[rowIndex]= record[mes.name].rendered
                        if (record[mes.name].links) {
                            barDatas[index].links[rowIndex] = record[mes.name].links
                        }
                    }    
                } else {
                    for (const flatKey of Object.keys(record[mes.name])) {
                        const pivotValues = flatKey.split(/\|FIELD\|/g)
                        if (!details.crossfilterEnabled || pivotValues[0] !== "crossfilterSelection") {
                            const mes_label2 = pivotValues[0] + ' - '+ mes_label
                            const label_name = mes_label2
                            const index = barDatas.findIndex(d => d.name === label_name)
                            const rowIndex = labels.findIndex(d => d === record[labelFields].value)
                            if (index < 0) {
                                console.error("undefined column label:" + label_name)
                            }
                            // cross filter
                            const mPivot = queryResponse.pivots.filter(p => {
                                return p.key === pivotValues[0]
                            })
                            if (LookerCharts.Utils.getCrossfilterSelection(record, mPivot[0]) != 2) {
                                barDatas[index].data[rowIndex] = record[mes.name][flatKey].value
                            } else {
                                barDatas[index].data[rowIndex] = {
                                    y: record[mes.name][flatKey].value,
                                    color: "#DEE1E5"
                                }
                            }
                            barDatas[index].rendered_values[rowIndex]= record[mes.name][flatKey].rendered
                            if (record[mes.name][flatKey].links) {
                                barDatas[index].links[rowIndex] = record[mes.name][flatKey].links
                            }
                        }
                    }
                }
            }
        })

        let stacking_option
        if (config.series_positioning ==='s') {
            stacking_option = 'normal'
        } else if (config.series_positioning =='p') {
            stacking_option = 'percent'
        }

        const xAxisOptions = {}
        xAxisOptions['categories'] = dimDatas
        if (config.enable_scroll) {
            xAxisOptions['scrollbar'] = { enabled: true}
            xAxisOptions['min'] = 0,
            xAxisOptions['max'] = config.number_of_categories > barDatas[0].data.length ? barDatas[0].data.length -1 : config.number_of_categories -1
        }
        const yAxisOptions = {
            "title": {
                "text": ""
            },
            labels: {
                formatter: function() {
                    return CustomUtil.numberFormatter(this.value, measure_like[0]);
                }
            }
        }
        if (config.series_positioning ==='s') {
            yAxisOptions['stackLabels'] = {
                enabled: config['total_value_label'],
                formatter: function() {
                    return CustomUtil.numberFormatter(this.total, measure_like[0]);
                }
            }
        }

        const legendOption = {
            enabled: config.hide_legend !== undefined ? !config.hide_legend : true,
        }
        if (config.hide_legend !== undefined)
            legendOption['align'] = config.legend_align
        Highcharts.chart('container', {
            chart: {
                type: 'bar'
            },
            title: {
                text: ''
            },
            xAxis: xAxisOptions,
            yAxis: yAxisOptions,
            legend: legendOption,
            plotOptions: {
                series: {
                    stacking: stacking_option,
                    animation: false,
                    dataLabels: {
                        enabled: config.value_labels,
                        formatter: function() {
                            if (config.value_labels) {
                                return CustomUtil.numberFormatter(this.y, measure_like[0]);
                            } else {
                                return undefined;
                            }
                        }
                    },
                    // event handler (to render drilldown dialog and enable cross filterling)
                    point: {
                        events: {
                            click: function (event) {
                                if (details.crossfilterEnabled) {
                                    let pivotValue
                                    if (queryResponse.pivots) {
                                        const names = this.series.name.split(' - ')
                                        pivotValue = queryResponse.pivots.filter(p => {
                                            return names[0] === p.key
                                        })
                                    }
                                    LookerCharts.Utils.toggleCrossfilter({
                                        row: data[this.index],
                                        event: event,
                                        pivot: pivotValue ? pivotValue[0] : pivotValue
                                    })
                                } else {
                                    LookerCharts.Utils.openDrillMenu({
                                        links: this.series.options.links[this.index],
                                        event: event
                                    });    
                                }
                            }
                        }
                    }
                }
            },
            credits: {
                enabled: false
            },
            series: barDatas,
            // customize tooltip
            tooltip: {
                formatter: function() {
                    return this.x + '<br/>' + this.series.name + ': ' + this.series.options.rendered_values[this.point.index];
                }                    
            }
        })

        done()
    }
}
looker.plugins.visualizations.add(visObject);