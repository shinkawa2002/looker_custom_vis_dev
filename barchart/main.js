import { pointRadial } from "d3";
import * as Highcharts from "highcharts";
import {CustomUtil} from './util';

const visObject = {
    options: {
        value_label_type: {
            label: "Value Label Type",
            section: 'Value',
            type: 'string',
            display: 'select',
            default: 'value',
            values: [
                {'Value': 'value'},
                {'Percentage': 'percentage'},
                {'Series and value': 'valueWlabel'},
                {'Series and Percentage': 'valueWpercent'},
            ]
        },
        value_label_display: {
            type: 'boolean',
            label: "Display Value",
            section: 'Value',
            default: 'false',
        },
        show_full_field_name: {
            type: 'boolean',
            label: 'Show Full Field Name',
            default: false,
            section: "Series",
        },

    },
    create: function(element, config) {
        element.innerHTML = `
        <style>
        .highcharts-figure,
        .highcharts-data-table table {
            min-width: 310px;
            max-width: 800px;
            margin: 1em auto;
        }
        
        #container {
            height: 100%;
            width: 100%;
        }
        
        .highcharts-data-table table {
            font-family: Verdana, sans-serif;
            border-collapse: collapse;
            border: 1px solid #ebebeb;
            margin: 10px auto;
            text-align: center;
            width: 100%;
            max-width: 500px;
        }
        
        .highcharts-data-table caption {
            padding: 1em 0;
            font-size: 1.2em;
            color: #555;
        }
        
        .highcharts-data-table th {
            font-weight: 600;
            padding: 0.5em;
        }
        
        .highcharts-data-table td,
        .highcharts-data-table th,
        .highcharts-data-table caption {
            padding: 0.5em;
        }
        
        .highcharts-data-table thead tr,
        .highcharts-data-table tr:nth-child(even) {
            background: #f8f8f8;
        }
        
        .highcharts-data-table tr:hover {
            background: #f1f7ff;
        }          
        </style>
        <div id="container"></div>
        `;
    },
    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();
        const container = document.getElementById("container");
        container.innerHTML="";

        if (!CustomUtil.handleErrors(this, queryResponse, {
            min_dimensions: 1, max_dimensions: 2,
            min_measures: 1, max_measures: Infinity,
            min_pivots: 0, max_pivots: 1
        })) return;

        const { fields } = queryResponse
        const { dimensions, measures, tableCalcs, dimension_like, measure_like} = fields
    
        const labels = []
        const labelFields = dimension_like[0].name
        const stackNameFields = dimension_like.length == 2 ? dimension_like[1].name: ""
        const pivots = fields.pivots.map(d => d.name)
    
        // set up stacks and datasets
        const stacks = []
        data.forEach(col => {
            if (!labels.includes(col[labelFields].value))
                labels.push(col[labelFields].value)
            
            if ("" !== stackNameFields && !stacks.includes(col[stackNameFields].value))
                stacks.push(col[stackNameFields].value)
        })
    
        const pivotSet = {}
        for (const pivot of pivots) {
            pivotSet[pivot] = true
        }
        const pivotLabels = []
        if (pivots.length > 0) {
            const row = data[0]
            for (const flatKey of Object.keys(row[measure_like[0].name])) {
                const pivotValues = flatKey.split(/\|FIELD\|/g)
                pivotLabels.push(pivotValues[0])
            }
        }

        // generate datasets
        const dimDatas = [];
        const barDatas = [];

        measure_like.forEach((mes, idx) => {
            const mes_label = config.show_full_field_name ? mes.label : mes.label_short;
            if (pivots.length === 0) {
                if (stacks.length > 0) {
                    stacks.forEach(stack => {
                        barDatas.push({
                            name: stack + ' - ' + mes_label,
                            stack: stack,
                            data: new Array(labels.length),
                            links: new Array(labels.length)
                        })
                    })
                } else {
                    barDatas.push({
                        name: mes_label,
                        data: new Array(labels.length),
                        links: new Array(labels.length)
                    })
                }
            } else {
                for (const pivotName of pivotLabels) {
                    const mes_label2 = pivotName + " - " + mes_label
                    if (stacks.length > 0) {
                        stacks.forEach(stack => {
                            barDatas.push({
                                name: stack + ' - ' + mes_label2,
                                stack: stack,
                                data: new Array(labels.length),
                                links: new Array(labels.length)
                            })
                        })
                    } else {
                        const config_label = mes_label2.replaceAll(" ", "_")
                        barDatas.push({
                            name: mes_label2,
                            data: new Array(labels.length),
                            links: new Array(labels.length)
                        })
                    }   
                }
            }
        })

        data.forEach((record, idx) => {
            // xAxis
            if (!dimDatas.includes(record[labelFields].rendered ? record[labelFields].rendered : record[labelFields].value)) {
                dimDatas.push(record[labelFields].rendered ? record[labelFields].rendered : record[labelFields].value);
            }

            // yAxis
            for (const mes of measure_like) {
                const mes_label = config.show_full_field_name ? mes.label : mes.label_short
                if (pivots.length == 0) {
                    const label_name = stackNameFields === "" ? mes_label : record[stackNameFields].value + ' - ' + mes_label
                    const index = barDatas.findIndex(d => d.name === label_name)
                    const rowIndex = labels.findIndex(d => d === record[labelFields].value)
                    if (index == -1) {
                        console.error("argumement is not decleared")
                    } else {
                        barDatas[index].data[rowIndex]= record[mes.name].value
                        if (record[mes.name].links) {
                            barDatas[index].links[rowIndex] = record[mes.name].links
                        }
                    }    
                } else {
                    for (const flatKey of Object.keys(record[mes.name])) {
                        const pivotValues = flatKey.split(/\|FIELD\|/g)
                        const mes_label2 = pivotValues[0] + ' - '+ mes_label
                        const label_name = stackNameFields === "" ? mes_label2 : record[stackNameFields].value + ' - ' + mes_label2
                        const index = barDatas.findIndex(d => d.name === label_name)
                        const rowIndex = labels.findIndex(d => d === record[labelFields].value)
                        if (index < 0) {
                            console.error("undefined column label:" + label_name)
                        }
                        barDatas[index].data[rowIndex] = record[mes.name][flatKey].value
                        if (record[mes.name].links) {
                            barDatas[index].links[rowIndex] = record[mes.name][flatKey].links
                        }
                    }
                }
            }
        })

        const dataLabelOptions = {}
        if (config.value_label_display) {
            dataLabelOptions['enabled'] = true
            if (config.value_label_type === "value") {
                dataLabelOptions['format'] = '{point.y}'
            } else if(config.value_label_type === "percentage") {
                dataLabelOptions['format'] = '{point.percentage:,.1f}%'
            } else if(config.value_label_type === "valueWlabel") {
                dataLabelOptions['formatter'] = function () {
                    const htmlLabel = '<div>' + this.series.name + 
                        ': </div><div>' + this.y + '</div>'
                    return htmlLabel
                }
            } else if(config.value_label_type === "valueWpercent") {
                dataLabelOptions['formatter'] = function () {
                    const htmlLabel = '<div>' + this.series.name + 
                        ': </div><div>' + CustomUtil.roundDecimal(this.percentage,1) + '%</div>'
                    return htmlLabel
                }
            }

        } else {
            dataLabelOptions['enabled'] = false
        }


        Highcharts.chart('container', {
            chart: {
                type: 'bar'
            },
            title: {
                text: ''
            },
            xAxis: {
                categories: dimDatas,
            },
            yAxis: {
                "title": {
                    "text": ""
                }
            },
            legend: {
                
            },
            plotOptions: {
                series: {
                    stacking: "normal",
                    dataLabels: dataLabelOptions
                }
            },
            series: barDatas
        })

        done();
    }
};
looker.plugins.visualizations.add(visObject);