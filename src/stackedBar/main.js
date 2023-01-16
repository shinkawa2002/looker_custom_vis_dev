// const { getDefaultCompilerOptions } = require("typescript");
// import ChartDataLables from 'chartjs-plugin-databales';

// import { useLayoutEffect } from "react";

import { CustomUtil } from "../barchart_scroll/util";
import { Chart, CategoryScale, PointElement, LinearScale, LineElement, Title, Tooltip, Legend, BarController, BarElement } from "chart.js"
import ChartDataLabels from 'chartjs-plugin-datalabels'

const LOOKER_ROW_TOTAL_KEY = '$$$_row_total_$$$'

const stackedBar = {
    id: "stacked_bar_with_group",
    label: "Stacked Gtoup Column",
    options: {
        legend_pos: {
            type: "string",
            label: "legend display",
            display: "radio",
            default: "right",
            values: [
                {"bottom": "bottom"},
                {"left": "left"},
                {"right": "right"},
            ],
            section: "Plot",
        },
        legend_disp: {
            type: 'boolean',
            label: "Show Legend",
            default: true,
            section: "Plot",
        },
        show_full_field_name: {
            type: 'boolean',
            label: 'Show Full Field Name',
            default: false,
            section: "Series",
        },
        show_values: {
            type: 'boolean',
            label: 'Show Value Label',
            default: false,
            section: "Values"
        },
        value_color: {
            type: 'string',
            label: 'Values Color',
            display: "color",
            default: "#36A2EB",
            section: "Values"
        },
        x_scale_type: {
            type: 'string',
            label: 'Scale Type',
            default: 'auto',
            display: 'radio',
            values: [
                {"Automatic Based on Data": "auto"},
                {"Ordinal": "ordinal"},
                {"Time": "time"}
            ],
            setion: "X"
        },
        x_scale_reverse: {
            type: 'boolean',
            label: 'Reverse Axis',
            default: false,
            section: "X",
        },
        x_scale_disp: {
            type: 'boolean',
            label: "Show Axis Name",
            default: true,
            section: "X"
        },
        x_schale_label: {
            type: 'string',
            label: "Custom Axis Name",
            default: "",
            section: "X",
        },
        x_scale_value_label: {
            type: 'boolean',
            label: 'Axis Value Labels',
            default: true,
            section: "X",
        },
        x_scale_gridlines: {
            type: 'boolean',
            label: 'Gidlines',
            default: true,
            section: "X",
        },
        y_scale_reverse: {
            type: 'boolean',
            label: 'Reverse Axis',
            default: false,
            section: "Y",
        },
        y_scale_gridlines: {
            type: 'boolean',
            label: 'Gidlines',
            default: true,
            section: "Y",
        },
        y_scale_disp: {
            type: 'boolean',
            label: "Show Axis Name",
            default: true,
            section: "Y"
        },
        y_schale_label: {
            type: 'string',
            label: "Custom Axis Name",
            default: "",
            section: "Y"
        },
        y_scale_value_label: {
            type: 'boolean',
            label: 'Axis Value Labels',
            default: true,
            section: "Y",
        },
    },

    barChart: {},
    CHART_COLORS: [
        "#ff6384",
        "#ff9f40",
        "#ffcd56",
        "#4bc0c0",
        "#36a2eb",
        "#9966ff",
        "#c9cbcf",
    ],
    dataSets: [],
  // Set up the initial state of the visualization
  create: function(element, config) {
    // Insert a <style> tag with some styles we'll use later.
    element.innerHTML = `
      <style>
        body {
            height: 100%;
        }
        .myChart {
            width: 100%;
            height: 100%;
        }
        .chart-container {
            position: relative;
            // height: 40vh;
            // width: 80vw;
        }
        ul.header {
          font-weight: bold,
          list-style-type: none; /* Remove bullets */
          padding: 0; /* Remove padding */
          margin: 0; /* Remove margins */
        }
        ul.items {
          list-style-type: none; /* Remove bullets */
          padding-left: 10px; /* Remove padding */
          margin: 0; /* Remove margins */
        }
      </style>
    `;

    // Create a container element to let us center the text.
    var container = element.appendChild(document.createElement("div"));
    container.className = "chart-container"
    let canvas = container.appendChild(document.createElement("canvas"));
    canvas.className = "myChart"
    canvas.id = "myChart"

    var ctx = document.getElementById('myChart').getContext('2d');
    const chartOptions = this.getChartConfig(config)
    const chartConfig = {
        type: 'bar',
        options: chartOptions
    }
    if (ChartDataLabels) {
        Chart.register(ChartDataLabels)
    }

    Chart.register(
        CategoryScale,
        PointElement, LinearScale, LineElement,
        BarController, BarElement,
        Title,
        Legend,
        Tooltip
    )

    this.barChart = new Chart(ctx, chartConfig)

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {

    const width = element.clientWidth
    const height = element.clientHeight

    this.barChart.canvas.parentNode.style.height = height + 'px';
    this.barChart.canvas.parentNode.style.width = width + 'px';

    // Clear any errors from previous updates
    this.clearErrors();

    if (!config || !data) return
    if (details && details.changed && details.changed.size) return

    if(!CustomUtil.handleErrors(this, queryResponse, {
        min_dimensions: 1, max_dimensions: 2,
        min_measures: 1, max_measures: Infinity,
        min_pivots: 0, max_pivots: 1
    })) return

    const { fields } = queryResponse
    const { dimensions, measures, tableCalcs, dimension_like, measure_like} = fields

    const labels = []
    const labelFields = dimension_like[0].name
    const stackNameFields = dimension_like.length == 2 ? dimension_like[1].name: ""
    const chartOptions = this.getChartConfig(config, measure_like)
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

    const dataSets = []
    // dataSets = []
    let i = 0
    const axeses = []
    measure_like.forEach((mes, idx) => {
        const axisName = 'yAxis' + (idx > 0 ? idx : '')
        axeses.push(axisName)
        let chart_type = idx > 0 ? 'line' : 'bar'
        const mes_label = config.show_full_field_name ? mes.label : mes.label_short
        if (pivots.length === 0) {
            if (stacks.length > 0) {
                stacks.forEach(stack => {
                    const config_label = (stack + ' - ' + mes_label).replaceAll(" ", "_")
                    dataSets.push({
                        yAxisID: axisName,
                        label: stack + ' - ' + mes_label,
                        stack: stack,
                        type: chart_type,
                        backgroundColor: config[config_label] ? config[config_label] : stackedBar.CHART_COLORS[i++],
                        data: new Array(labels.length),
                        links: new Array(labels.length)
                    })
                })
            } else {
                const config_label = mes_label.replaceAll(" ", "_")
                dataSets.push({
                    yAxisID: axisName,
                    label: mes_label,
                    type: chart_type,
                    backgroundColor: config[config_label] ? config[config_label] : stackedBar.CHART_COLORS[i++],
                    data: new Array(labels.length),
                    links: new Array(labels.length)
                })
            }    
        } else {
            for (const pivotName of pivotLabels) {
                const mes_label2 = pivotName + " - " + mes_label
                if (stacks.length > 0) {
                    stacks.forEach(stack => {
                        const config_label = (stack + ' - ' + mes_label2).replaceAll(" ", "_")
                        dataSets.push({
                            label: stack + ' - ' + mes_label2,
                            yAxisID: axisName,
                            stack: stack,
                            type: chart_type,
                            backgroundColor: config[config_label] ? config[config_label] : stackedBar.CHART_COLORS[i++],
                            data: new Array(labels.length),
                            links: new Array(labels.length)
                        })
                    })
                } else {
                    const config_label = mes_label2.replaceAll(" ", "_")
                    dataSets.push({
                        yAxisID: axisName,
                        label: mes_label2,
                        type: chart_type,
                        backgroundColor: config[config_label] ? config[config_label] : stackedBar.CHART_COLORS[i++],
                        data: new Array(labels.length),
                        links: new Array(labels.length)
                    })
                }        
            }
        }
    })

    // update config
    // options = {} 
    // for (const opt of Object.keys(this.options)) {
    //     options[opt] = this.options[opt]
    // }
    let optOrder = this.options.length
    dataSets.forEach(ds => {
        const id = ds.label.replaceAll(" ", "_")
        if (!this.options[id]) {
            this.options[id] = {
                label: ds.label + " Color",
                default: ds.backgroundColor,
                type: "string",
                display: "color",
                section: "Series",
                order: optOrder++,
                // display_size: "third",
            }
        }
    })
    // this.opsions = options
    this.trigger('registerOptions', this.options)
    // options = {}

    // set up data to dataset
    data.forEach(col => {
        for (const mes of measure_like) {
            const mes_label = config.show_full_field_name ? mes.label : mes.label_short
            if (pivots.length == 0) {
                const label_name = stackNameFields === "" ? mes_label : col[stackNameFields].value + ' - ' + mes_label
                const index = dataSets.findIndex(d => d.label === label_name)
                const rowIndex = labels.findIndex(d => d === col[labelFields].value)
                if (index == -1) {
                    console.error("argumement is not decleared")
                } else {
                    dataSets[index].data[rowIndex]= col[mes.name].value
                    if (col[mes.name].links) {
                        dataSets[index].links[rowIndex] = col[mes.name].links
                    }
                }    
            } else {
                for (const flatKey of Object.keys(col[mes.name])) {
                    const pivotValues = flatKey.split(/\|FIELD\|/g)
                    const mes_label2 = pivotValues[0] + ' - '+ mes_label
                    const label_name = stackNameFields === "" ? mes_label2 : col[stackNameFields].value + ' - ' + mes_label2
                    const index = dataSets.findIndex(d => d.label === label_name)
                    const rowIndex = labels.findIndex(d => d === col[labelFields].value)
                    if (index < 0) {
                        console.error("undefined column label:" + label_name)
                    }
                    dataSets[index].data[rowIndex] = col[mes.name][flatKey].value
                    if (col[mes.name].links) {
                        dataSets[index].links[rowIndex] = col[mes.name].links
                    }
                }
            }
        }
    })

    const chartData = {
        labels: labels,
        datasets: dataSets,
    }

    this.barChart.data = chartData
    this.barChart.options = chartOptions
    // this.barChart.plugins = [htmlLegendPlugin]
    // config legend
    // if (config.legend_pos) {
    //     this.barChart.options.plugins.legend.position = config.legend_pos
    // }


    // console.log(this.barChart)

    this.barChart.update('none')

    // We are done rendering! Let Looker know.
    done()
  },
  getChartConfig: function(config, measure_like) {
    let label_display = config.show_values ? config.show_values : false
    if (label_display) label_display = "auto"
    let scales = {
        x: {
            // stacked: dimension_like.length == 2 ? true : false,
            stacked: true,
            display: config.x_scale_value_label ? 'auto' : false,
            reverse: config.x_scale_reverse,
            grid: {
                display: config.x_scale_gridlines,
            },
            title: {
                display: config.x_scale_disp,
                text: config.x_schale_label ? config.x_schale_label: "",
            }
        }
    }
    if (measure_like && measure_like.length > 1) {
        measure_like.forEach((mes, idx) => {
            scales['yAxis' + (idx > 0 ? idx : '')] = {
                beginAtZero: true,
                stacked: true,
                display: config.y_scale_value_label ? 'auto' : false,
                reverse: config.y_scale_reverse,
                grid: {
                    display: config.y_scale_gridlines,
                },
                position: idx > 0 ? 'right': 'left',
                title: {
                    display: config.y_scale_disp,
                    text: config.y_schale_label ? config.y_schale_label: "",    
                }
            }
        })
        
    } else {
        scales['y'] = {
            beginAtZero: true,
            stacked: true,
            display: config.y_scale_value_label ? 'auto' : false,
            reverse: config.y_scale_reverse,
            grid: {
                display: config.y_scale_gridlines,
            },
            title: {
                display: config.y_scale_disp,
                text: config.y_schale_label ? config.y_schale_label: "",    
            }
        }
    }
    return {
        scales: scales,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: config.legend_disp,
                // display: false,
                // position: 'right',
                position: config.legend_pos ? config.legend_pos : "right" 
            },
            datalabels: {
                color: config.value_color ? config.value_color : "#36A2EB",
                display: label_display,
            },
            // tooltip: {
            //     callbacks: {
            //         footer: this.footer,
            //     }
            // }
            // htmlLegend: {
            //     containerID: 'legend-container',
            // }
        }
    }
    // return chartOptions
  },
  // externalTooltipHandler: (context) => {
  //   const {chart, tooltip} = context
  //   const tooltipEl = getOrCreateTooltip(chart)

  //   // hide if no tooltip
  //   if (tooltip.opacity == 0) {
  //     tooltipEl.style.opacity = 0
  //     return
  //   }

  //   // see text
  //   if (tooltip.body) {
  //     const titleLines = tooltip.title || []
  //     const bodyLines = tooltip.body.map(b => b.lines)


  //   }
  // }
  // footer : (tooltipItems) => {
  //   // console.log(tooltipItems)
  //   let retHtml = ""
  //   const mesureLinks = []
  //   const urlLinks = []
  //   let linkCount = 0
  //   tooltipItems.forEach((item, index) => {
  //     const links = item.dataset.links[item.dataIndex]
  //     if (links) {
  //       linkCount++
  //       links.forEach((link, index) => {
  //         if (link.type === "url") {
  //           urlLinks.push(link)
  //         } else if (link.type === "measure_default") {
  //           mesureLinks.push(link)
  //         }
  //       })
  //     }
  //   })

  //   if (linkCount > 0) {
  //     retHtml += "<ul class='header'>"
  //     if (mesureLinks.length > 0) {
  //       retHtml+= "<li>Explore<ul class='linCount'>"
  //       mesureLinks.forEach((link, index) => {
  //         retHtml += "<li><a href='" + link.url + "'>" + link.label + "</a></li>"
  //       })
  //       retHtml += "</ul></li>"
  //     }
  //     if (urlLinks.length > 0) {
  //       retHtml+= "<li>Link<ul class='linCount'>"
  //       mesureLinks.forEach((link, index) => {
  //         retHtml += "<li><a href='" + link.url + "' target='_blank'>" + link.label + "</a></li>"
  //       })
  //       retHtml += "</ul></li>"
  //     }
  //     retHtml += "</ul>"
  //   }
  //   return retHtml
  // }

}

// const htmlLegendPlugin = {
//     id: 'htmlLegend',
//     afterUpdate: function (chart, args, options) {
//         const ul = getOrCreateLegendList(chart, options.containerID)

//         // remove old legend items
//         while (ul.firstChild) {
//             ul.firstChild.remove()
//         }

//         // Reuse the built-in legendItems generator
//         const items = chart.options.plugins.legend.labels.generateLabels(chart)
//         items.forEach(item => {
//             const li = document.createElement('li');
//             li.style.alignItems = 'center';
//             li.style.cursor = 'pointer';
//             li.style.display = 'flex';
//             li.style.flexDirection = 'row';
//             li.style.marginLeft = '10px';
      
//             li.onclick = () => {
//               const {type} = chart.config;
//               if (type === 'pie' || type === 'doughnut') {
//                 // Pie and doughnut charts only have a single dataset and visibility is per item
//                 chart.toggleDataVisibility(item.index);
//               } else {
//                 chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
//               }
//               chart.update();
//             };
      
//             // Color box
//             const boxSpan = document.createElement('span');
//             boxSpan.style.background = item.fillStyle;
//             boxSpan.style.borderColor = item.strokeStyle;
//             boxSpan.style.borderWidth = item.lineWidth + 'px';
//             boxSpan.style.display = 'inline-block';
//             boxSpan.style.height = '20px';
//             boxSpan.style.marginRight = '10px';
//             boxSpan.style.width = '20px';
      
//             // Text
//             const textContainer = document.createElement('p');
//             textContainer.style.color = item.fontColor;
//             textContainer.style.margin = 0;
//             textContainer.style.padding = 0;
//             textContainer.style.textDecoration = item.hidden ? 'line-through' : '';
      
//             const text = document.createTextNode(item.text);
//             textContainer.appendChild(text);
      
//             li.appendChild(boxSpan);
//             li.appendChild(textContainer);
//             ul.appendChild(li);
//         });
//     }
// }

// const getOrCreateLegendList = (chart, id) => {
//     const legendContainer = document.getElementById(id)
//     let listContainer = legendContainer.querySelector('ul')

//     if (!listContainer) {
//         listContainer = document.createElement('ul');
//         listContainer.style.display = 'flex';
//         listContainer.style.flexDirection = 'row';
//         listContainer.style.margin = 0;
//         listContainer.style.padding = 0;
    
//         legendContainer.appendChild(listContainer);        
//     }

//     return listContainer;
// }

looker.plugins.visualizations.add(stackedBar)