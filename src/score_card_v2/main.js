const visObject = {
  options: {
    table_width: {
      section: "Style",
      type: "boolean",
      default: "true",
      label: "Size Width to Fit"
    }
  },
  create: function (element, config) {
    element.innerHTML = `
    <style>
      .table {
        display: table;
        font-family: "Google Sans", "Noto Sans", "Noto Sans JP", "Noto Sans CJK KR", "Noto Sans Arabic UI", "Noto Sans Devanagari UI", "Noto Sans Hebrew", "Noto Sans Thai UI", Helvetica, Arial, sans-serif
        font-color: #3a4245;
      }
      .table_row {
          display: table-row;
      }
      .row_label {
          display: table-cell;
          padding: 1rem;
          vertical-align: middle;
      }
      .main_title {
          font-size: 1.5rem;
      }
      .sub_title {
          font-size: 1rem;
      }
      .main_area {
          display: table-cell;
          vertical-align: middle;
          padding: 1rem;
      }
      .value_box {
          display: flex;
      }
      .value_area {
          display: inline-block;
          position: relative;
      }
      .value_area::before {
        content:"";
        display:inline-block;
        width:1rem;
        height:90%;
        background-color:#0097A7;
        position:absolute;
        top:0;
        left:-1.5rem;
      }
      .main_value {
          font-size: 2rem;
          font-weight: bold;
      }
      .sub_value {
          font-size: 1rem;
      }
      .compared_title{}
      .compared_value {
          font-weight: bold;
      }
      .comparison_area {
          padding-left: 0.5rem;
          margin: auto;
          vertical-align: middle;
      }
      .addional_area {
          display: table-cell;
          vertical-align: middle;
          padding: 1rem;
      }
      .additiona_row {
      }
      .additional_title {}
      .additional_value {
          font-weight: bold;
      }
    </style>
    <div id="container"></div>
    `
  },
  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Initialize
    this.clearErrors();

    const container = document.getElementById("container");
    container.innerHTML = "";

    if (queryResponse.fields.measures.length < 1) {
      this.addError({
        title: "Missing Measure",
        message: "This requires at least one measure."
      });
      return;
    }

    let options;
    options = Object.assign({}, this.options);
    // if (config) {
    //   options = Object.create(this.options);
    // } else {
    //   options = this.options;
    // }

    // make options for each measures, and set data for display
    const dispData = [];
    let addRows = [];
    let rowData = {};
    queryResponse.fields.measure_like.forEach(mes => {
      let mainFlag = true;
      if (config[mes.name + '-type'] && config[mes.name + '-type'] !== "main") mainFlag = false;

      if (mainFlag) {
        if (rowData) {
          rowData['additional'] = addRows;
          dispData.push(rowData)
          rowData = {}
          addRows = []
        } else {
          rowData = {}
        }
        rowData['main'] = data[0][mes.name].rendered ? data[0][mes.name].rendered: data[0][mes.name].value;
        rowData['main_label'] = config[mes.name + '-label'] ? config[mes.name + '-label'] : mes.label;
      } else if (config[mes.name + '-type'] === "compare") {
        rowData['compare'] = data[0][mes.name].rendered ? data[0][mes.name].rendered: data[0][mes.name].value;
        rowData['compare_label'] = config[mes.name + '-label'] ? config[mes.name + '-label'] : mes.label;
      } else if (config[mes.name + '-type'] === "changed") {
        rowData['changed'] = data[0][mes.name].rendered ? data[0][mes.name].rendered: data[0][mes.name].value;
      } else if (config[mes.name + '-type'] === "additional") {
        addRows.push({
          label: mes.label,
          value: data[0][mes.name].rendered ? data[0][mes.name].rendered: data[0][mes.name].value
        })
      }
    });
    rowData['additional'] = addRows;
    dispData.push(rowData)

    // Build display HTML
    const dispDiv = document.createElement('div', {"class":"table"});
    dispDiv.className = "table";
    if (config.table_width) {
      dispDiv.style.width = "100%"
    }

    dispData.forEach(dispRow => {
      const rowDiv = document.createElement('div',{"class": "table_row"});
      rowDiv.className = "table_row";
      // Label Area
      const labelAreaDiv = document.createElement('div', {"class": "row_label"});
      labelAreaDiv.className = "row_label";
      if(dispRow['main_label']) {
        const mainDiv = document.createElement('div',{"class": "main_title"});
        mainDiv.className = "main_title"
        mainDiv.innerText = dispRow["main_label"]
        labelAreaDiv.appendChild(mainDiv);
      }
      rowDiv.appendChild(labelAreaDiv);

      // Main Area
      const mainAreaDiv = document.createElement('div', {"class":"main_area"});
      mainAreaDiv.className = "main_area";
      const valueBoxDiv = document.createElement('div', {"class":"value_box"});
      valueBoxDiv.className = "value_box";
      const valueAreaDiv = document.createElement('div', {"class":"value_area"});
      valueAreaDiv.className = "value_area";
      if (dispRow['main']) {
        const mainDiv = document.createElement('div',{"class": "main_value"});
        mainDiv.className = "main_value";
        mainDiv.innerText = dispRow['main'];
        valueAreaDiv.appendChild(mainDiv);
      }
      if (dispRow['compare']) {
        const compDiv = document.createElement('div',{"class": "sub_value"});
        compDiv.className = "sub_value";
        const titleSpan = document.createElement('span',{"class": "compared_title"});
        titleSpan.className = "compared_title"
        titleSpan.innerText = dispRow['compare_label']  + ": ";
        const valueSpan = document.createElement('span',{"class": "compared_value"});
        valueSpan.className = "compared_value";
        valueSpan.innerText = dispRow['compare'];
        compDiv.appendChild(titleSpan);
        compDiv.appendChild(valueSpan);
        valueAreaDiv.appendChild(compDiv);
      }
      valueBoxDiv.appendChild(valueAreaDiv);
      const changedDiv = document.createElement('div',{"class": "comparison_area"});
      changedDiv.className = "comparison_area";
      if (dispRow['changed']) {
        changedDiv.innerText = dispRow['changed'];
      }
      valueBoxDiv.appendChild(changedDiv);
      mainAreaDiv.appendChild(valueBoxDiv);
      rowDiv.appendChild(mainAreaDiv);

      // additional area
      const additionalDiv = document.createElement('div',{"class": "addional_area"});
      additionalDiv.className = "addional_area";
      if (dispRow['additional']) {
        dispRow['additional'].forEach(adRow => {
          const adRowDiv = document.createElement('div',{"class": "additiona_row"});
          adRowDiv.className = "additiona_row";
          const adLabelDiv = document.createElement('span',{"class": "additional_title"});
          adLabelDiv.className = "additional_title";
          adLabelDiv.innerText = adRow.label + ": ";
          const adValueDiv = document.createElement('span',{"class": "additional_value"});
          adValueDiv.className = "additional_value";
          adValueDiv.innerText = adRow.value;
          adRowDiv.appendChild(adLabelDiv);
          adRowDiv.appendChild(adValueDiv);
          additionalDiv.appendChild(adRowDiv);
        })
      }
      rowDiv.appendChild(additionalDiv)

      dispDiv.appendChild(rowDiv);
    })

    // Construct Element
    container.appendChild(dispDiv);

    queryResponse.fields.measure_like.forEach(mes => {
      if (!options[mes.name]) {
        options[mes.name + '-type'] = {
          label: mes.label + ": type",
          section: "Series",
          type: "string",
          display: "select",
          default: "main",
          values: [
            { "Main Value": "main"},
            { "Compared Value": "compare"},
            { "Changed Value": "changed" },
            { "Additional Value": "additional" }
          ]
        }
        options[mes.name + '-label'] = {
          section: "Style",
          label: mes.label + ": label",
          type: "string",
          default: mes.label
        }
      }
    })

    // update options
    if (options) {
      this.trigger('registerOptions', options) // register options with parent page to update visConfig
    }

    done()

  }
};

looker.plugins.visualizations.add(visObject);