import * as Highcharts from "highcharts";
import gantt from 'highcharts/modules/gantt';

const visObject = {
    options: {
    },
    create: function(element, config) {
        element.innerHTML = `
        <style>
        #container {
            /* max-width: 1200px;
            min-width: 800px;
            height: 400px; */
            width: 100%;
            height: 100%;
            margin: 1em auto;
        }
        
        .scrolling-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        .startPoint {
            width: 0.5em;
            height: 3em;
            margin-top: -5px;
            margin-left: -10px;
            background-color: green;
        }
        .endPoint {
            width: 0.5em;
            height: 3em;
            margin-top: -5px;
            margin-left: 10px;
            background-color: green;
        }
        .circle {
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
        }
        .square {
            width: 0.5em;
            height: 1.5rem;
        }
        .highcharts-title {
            color: rgba(0,0,0,0)
        }
        </style>
        <div class="scrolling-container">
	        <div id="container"></div>
        </div>
        `;
        gantt(Highcharts);
    },
    updateAsync: function(data, element, config, queryResponse, details, done) {
        const colorIndexes = ["#1A73E8", "#12B5CB", "#E52592", "#E8710A", "#F9AB00", "#7CB342", "#9334E6", "#80868B", "#079c98", "#A8A116", "#EA4335", "#FF8168"]

        this.clearErrors();

        const dateDims = queryResponse.fields.dimensions.filter(dim => dim.type.indexOf('date') >= 0);
        const labelDims = queryResponse.fields.dimensions.filter(dim => dim.type.indexOf('date') < 0);
        if (dateDims == 0) {
            this.addError({
                title: 'Date fields missing',
                message: 'This requires one string and one date dimimesion at least.'
            })
            return;
        }

        const container = document.getElementById('container');


        // gather column size
        const dataColumns = [];
        queryResponse.fields.dimensions.forEach(dim => {
            const formatDim = '{point.' + dim.name.replace('.', '-') +'}';
            const columnObj = {}
            columnObj.title = {
                text: dim.label_short ? dim.label_short : dim.shortName
            };
            columnObj.labels = {                    
                format: formatDim,
            };    
            dataColumns.push(columnObj);
        })

        // build date data
        const ganttData = []
        data.forEach((record, idx) => {
            dateDims.forEach((dim, dateIdx) => {
                const dataObj = {};
                const dataDate = Date.parse(record[dim.name].value);
                dataObj['start'] = dataDate;
                dataObj['end'] = dataDate + (24 * 60 * 60 * 1000) - 1;
                dataObj['y'] = idx;
                if (config.show_gantt_line ? config.show_gantt_line: false) {
                    dataObj['color'] = (config['gant_line_color'] ? config['gant_line_color'] : colorIndexes[dateIdx]) + '4d';

                } else {
                    dataObj['color'] = 'rgba(0,0,0,0)';
                }

                dataObj['style'] = config[dim.name + '-style'] ? config[dim.name + '-style'] : 'squareFilled';
                dataObj['labelColor'] = config[dim.name + '-color'] ? config[dim.name + '-color'] : colorIndexes[dateIdx];
                dataObj['labelType'] = config[dim.name + '-type'] ? config[dim.name + '-type'] : 'center';

                labelDims.forEach(d => {
                    dataObj[d.name.replace('.', '-')] = record[d.name].rendered ? record[d.name].rendered : record[d.name].value;
                })
                dateDims.forEach(dd => {
                    dataObj[dd.name.replace('.', '-')] = record[dd.name].rendered ? record[dd.name].rendered : record[dd.name].value;
                })

                ganttData.push(dataObj);
            })
        })

        let currentDateIndicator;
        if (config['current_indicator']) {
            currentDateIndicator = {
                width: 1,
                dashStyle: 'dot',
                label: {
                    format: '%Y-%m-%d'
                }
            }
        } else {
            currentDateIndicator = false
        }
        // setup gantt
        Highcharts.ganttChart('container', {
            title: {
                text: 'Gantt Sample',
                style: {
                    color: 'rgba(0,0,0,0)'
                }
            },
            xAxis: [{
                opposite: false,
                currentDateIndicator: currentDateIndicator,
                labels: {
                    format: '{value}',
                        formatter() {
                            const unitName = this.tickPositionInfo.unitName;
                            const format = unitName === 'week' ? '%b' : '%b %e';
            
                            return Highcharts.dateFormat(format, this.value )
                        }
                }            
            }],
            yAxis: {
                type: 'category',
                grid: {
                    enabled: true,
                    borderColor: 'rgba(0,0,0,0.3)',
                    borderWidth: 1,
                    columns: dataColumns
                }
            },
            series: [{
                data: ganttData,
                dataLabels: [{
                    enabled: true,
                    // format: '<div class="circle">&nbsp;</div>',
                    formatter: function() {
                        if (this.point.labelType === 'center' || this.point.labelType === 'end') {
                            const format = '<div style="color:rgba(0,0,0,0);background-color:rgba(0,0,0,0);width:0rem;height:0rem;">&nbsp;</div>'
                            return format
                        } else {
                            const styles = [];
                            const color = this.point.labelColor;
                            styles.push("height: 1.5rem");
                            styles.push("margin-left: -0.5rem");
                            styles.push("overflow: hidden");
                            styles.push("color: " + color);
                            styles.push("border: 2px solid " + color);
    
                            if (this.point.style === "squareFilled") {
                                styles.push("width: 0.5rem");
                                styles.push("background-color: " + color);
                            } else if (this.point.style === "squareFilled") {
                                styles.push("width: 0.5rem");
                            } else if (this.point.style === "circleFilled") {
                                styles.push("width: 1.5rem");
                                styles.push("border-radius: 50%;")
                                styles.push("background-color: " + color);
                            } else if (this.point.style === "circleOutline") {
                                styles.push("width: 1.5rem");
                                styles.push("border-radius: 50%;")
                            }
                            const format = '<div style="' + styles.join(";") + '">&nbsp;</div>';
                            return format;                            
                        }
                    },
                    useHTML: true,
                    align: 'left',
                    /* allowOverlap: true, */
                },
                {
                    enabled: true,
                    // format: '<div class="circle">&nbsp;</div>',
                    formatter: function() {
                        if (this.point.labelType === 'center' || this.point.labelType === 'start') {
                            const format = '<div style="color:rgba(0,0,0,0);background-color:rgba(0,0,0,0);width:0rem;height:0rem;">&nbsp;</div>';
                            return format;
                        } else {
                            const styles = [];
                            const color = this.point.labelColor;
                            styles.push("height: 1.5rem");
                            styles.push("margin-left: 1.5rem");
                            styles.push("overflow: hidden");
                            styles.push("color: " + color);
                            styles.push("border: 2px solid " + color);
    
                            if (this.point.style === "squareFilled") {
                                styles.push("width: 0.5rem");
                                styles.push("background-color: " + color);
                            } else if (this.point.style === "squareFilled") {
                                styles.push("width: 0.5rem");
                            } else if (this.point.style === "circleFilled") {
                                styles.push("width: 1.5rem");
                                styles.push("border-radius: 50%;")
                                styles.push("background-color: " + color);
                            } else if (this.point.style === "circleOutline") {
                                styles.push("width: 1.5rem");
                                styles.push("border-radius: 50%;")
                            }
                            const format = '<div style="' + styles.join(";") + '">&nbsp;</div>';
                            return format;    
                        }
                    },
                    useHTML: true,
                    x: 5,
                    align: 'right',
                    /* allowOverlap: true, */
                },
                {
                    enabled: true,
                    // format: '<div class="circle">&nbsp;</div>',
                    formatter: function() {
                        if (this.point.labelType === 'center') {
                            const styles = [];
                            const color = this.point.labelColor;
                            styles.push("height: 1.5rem");
                            styles.push("color: " + color);
                            styles.push("overflow: hidden");
                            styles.push("border: 2px solid " + color);

                            if (this.point.style === "squareFilled") {
                                styles.push("width: 0.5rem");
                                styles.push("background-color: " + color);
                            } else if (this.point.style === "squareFilled") {
                                styles.push("width: 0.5rem");
                            } else if (this.point.style === "circleFilled") {
                                styles.push("width: 1.5rem");
                                styles.push("border-radius: 50%;")
                                styles.push("background-color: " + color);
                            } else if (this.point.style === "circleOutline") {
                                styles.push("width: 1.5rem");
                                styles.push("border-radius: 50%;")
                            }
                            const format = '<div style="' + styles.join(";") + '">&nbsp;</div>';
                            return format;
                        } else {
                            const format = '<div style="color:rgba(0,0,0,0);background-color:rgba(0,0,0,0);width:0rem;height:0rem;">&nbsp;</div>';
                            return format;
                        }
                    },
                    useHTML: true,
                    align: 'center',
                    /* allowOverlap: true, */
                }]
            }]
        });

        // config Object setting
        const newConfig = Object.assign({}, this.initialOps);
        // const newConfig = {};
        dateDims.forEach((dim, idx) => {
            if (!this.options[dim.name + '-style'] || config[dim.name + '-style']) {
                newConfig[dim.name + '-style'] = {
                    label: dim.label_short + ': Style',
                    section: 'Style',
                    type: 'string',
                    display: 'select',
                    default: config[dim.name + '-style'] ? config[dim.name + '-style'] : 'squareFilled',
                    display_size: 'half',
                    values: [
                        {'Square Filled': 'squareFilled'},
                        {'Square Outline': 'squareOutline'},
                        {'Circle Filled': 'circleFilled' },
                        {'Circle Outline': 'circleOutline' },
                    ]
                }    
            }
            if (!this.options[dim.name + '-type'] || config[dim.name + '-type']) {
                newConfig[dim.name + '-type'] = {
                    label: dim.label_short + ': type',
                    section: 'Style',
                    type: 'string',
                    display: 'select',
                    display_size: 'half',
                    default: config[dim.name + '-type'] ? config[dim.name + '-type'] : 'center',
                    values: [
                        {'Center': 'center'},
                        {'Only Start': 'start'},
                        {'Only End': 'end' },
                        {'Start & End': 'both' },
                    ]
                }    
            }            
            if (!this.options[dim.name + '-color'] || config[dim.name + '-color']) {
                newConfig[dim.name + '-color'] = {
                    label: dim.label_short + ': Color',
                    section: 'Style',
                    type: 'string',
                    display: 'color',
                    default: config[dim.name + '-color'] ? config[dim.name + '-color'] : colorIndexes[idx]
                }    
            }
        })
        // newConfig['current_indicator'] = {
        //     label: 'Current Date Indicator',
        //     section: 'General',
        //     type: 'boolean',
        //     default: 'false',
        // };

        
        // if (newConfig) {
        //     this.trigger('registerOptions', newConfig) // register options with parent page to update visConfig
        // }      
        this.trigger('registerOptions', newConfig);

        done();
    },
    initialOps: {
        current_indicator: {
            label: 'Current Date Indicator',
            type: 'boolean',
            default: false,
            section: 'General'   
        },
        show_gantt_line: {
            label: 'Show Line',
            type: 'boolean',
            default: false,
            section: 'General'               
        },
        gant_line_color: {
            label: 'Line Color',
            section: 'General',
            type: 'string',
            display: 'color',
            default: '#D3D3D3'    
        }

    }
};

looker.plugins.visualizations.add(visObject);