import * as Highcharts from "highcharts";
import bullet from "highcharts/modules/bullet.js";

const visObject = {
    create: function(element, config) {
        element.innerHTML = `
        <style>
        .flex {
            display: flex;
            height: 100%;
            width: 100%;
        }
        .valueLabel {
            margin: auto;
        }
        .container {
            height: 100%;
        }
        </style>
        <div class="flex">
        <div id="container" class="container"></div>
        </div>
        `
        bullet(Highcharts);
    },
    updateAsync: function(data, element, config, queryResponse, details, done) {
        this.clearErrors();

        // error check
        if (queryResponse.fields.dimensions.length == 0 || queryResponse.fields.measures.length < 1) {
            this.addError({
                title: "Missing Fields",
                message: "This requires at least one Dimension and one Measure."
            })
            return;
        }

        // const figureElm = document.getElementById("figure");
        // figureElm.innerHTML = "";
        const container = document.getElementById("container");
        container.innerHTML = "";
        container.style.width = "100%";

        // Perp for data ingestion
        const labelFields = []
        queryResponse.fields.dimensions.forEach(dim => {
            labelFields.push(dim.name);
        })

        const valueField = queryResponse.fields.measure_like[0].name;
        const targetField = queryResponse.fields.measure_like.length > 1 ? queryResponse.fields.measure_like[1].name : "";

        // Initialize HighCharts
        Highcharts.setOptions({
            chart: {
                inverted: true,
                // marginLeft: 135,
                type: 'bullet',
            },
            title: {
                text: null
            },
            legend: {
                enabled: false
            },
            yAxis: {
                gridLineWidth: 0,
                title: null,
                labels: {
                    enabled: false // display yAxis label
                }
            },
            plotOptions: {
                series: {
                    pointPadding: 0.25,
                    borderWidth: 0,
                    pointWidth: 50,
                    color: '#0ff',
                    targetOptions: {
                        /* width: '200%' */
                        color: '#0f0'
                    },
                    // dataLabels: {
                    //     enabled: true,
                    //     position: 'right'
                    // }
                }
            },
            credits: {
                enabled: false
            },
            exporting: {
                enabled: false
            }
        });

        // Retrieve Data
        const categories = []
        const series = []
        data.forEach((record, index) => {
            const labelAxises = []
            labelFields.forEach(fieldName => {
                const labelValue = record[fieldName].rendered ? record[fieldName].rendered : record[fieldName].value;
                labelAxises.push(labelValue);
            })
            const xLabel = labelAxises.join(" - ");
            categories.push(xLabel);

            const yData = {
                y: record[valueField].value,
                y_render: record[valueField].rendered,
                target: record[targetField].value,
                target_render: record[targetField].rendered,
            }

            series.push(yData);
        });

        const containerId = "container";
        // container.id = containerId
        // // const valueArea = document.createElement('div');
        // // valueArea.className = "valueLabel"
        // const valueDiv  = document.createElement('div');
        // valueDiv.innerText = data[0][valueField].rendered ? data[0][valueField].rendered : data[0][valueField].value;
        // const compareDiv  = document.createElement('div');
        // compareDiv.innerText = data[0][targetField].rendered ? data[0][targetField].rendered : data[0][targetField].value;
        // valueArea.appendChild(valueDiv);
        // valueArea.appendChild(compareDiv);

        // flexContainer.appendChild(container);
        // // flexContainer.appendChild(valueArea);
        // figureElm.appendChild(flexContainer);

        Highcharts.chart(containerId, {
            chart: {
                marginTop: 5
            },
            xAxis: {
                categories: categories
            },
            series: [{
                data: series,
                dataLabels: {
                    enabled: true,
                    formatter: function() {
                        const dataLabel = '<div>' + this.point.y_render + '</div>' +
                        '<div>' + this.point.target_render + '</div>';
                        return dataLabel
                    },
                    useHTML: true,
                }
            }]
        });
        done();
    }
};

looker.plugins.visualizations.add(visObject);