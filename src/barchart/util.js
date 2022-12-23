import * as d3 from 'd3';
import * as Highcharts from "highcharts";

export const CustomUtil = {
    formatType: (valueFormat) => {
        if (typeof valueFormat != "string") {
            return function (x) {return x}
          }
          let format = ""
          switch (valueFormat.charAt(0)) {
            case '$':
              format += '$'; break
            case '£':
              format += '£'; break
            case '€':
              format += '€'; break
          }
          if (valueFormat.indexOf(',') > -1) {
            format += ','
          }
          splitValueFormat = valueFormat.split(".")
          format += '.'
          format += splitValueFormat.length > 1 ? splitValueFormat[1].length : 0
        
          switch(valueFormat.slice(-1)) {
            case '%':
              format += '%'; break
            case '0':
              format += 'f'; break
          }
          return d3.format(format);
    },

    handleErrors: (vis, resp, options) => {
        function messageFromLimits(min, max, field) {
            let message = "You need " + min
            if (max) {
              message += " to " + max
            }
            message += " " + field
            return message
          }
        
          if ((resp.fields.pivots.length < options.min_pivots) ||
              (resp.fields.pivots.length > options.max_pivots)) {
            let message
            vis.addError({
              group: "pivot-req",
              title: "Incompatible Pivot Data",
              message: messageFromLimits(options.min_pivots, options.max_pivots, "pivots"),
            });
            return false;
          } else {
            vis.clearErrors("pivot-req");
          }
        
          if ((resp.fields.dimension_like.length < options.min_dimensions) ||
              (resp.fields.dimension_like.length > options.max_dimensions)) {
            vis.addError({
              group: "dim-req",
              title: "Incompatible Dimension Data",
              message: messageFromLimits(options.min_dimensions, options.max_dimensions, "dimensions"),
            });
            return false;
          } else {
            vis.clearErrors("dim-req");
          }
        
          if ((resp.fields.measure_like.length < options.min_measures) ||
              (resp.fields.measure_like.length > options.max_measures)) {
            vis.addError({
              group: "mes-req",
              title: "Incompatible Measure Data",
              message: messageFromLimits(options.min_measures, options.max_measures, "measures"),
            });
            return false;
          } else {
            vis.clearErrors("mes-req");
          }
          return true;        
    },
    roundDecimal: (value, n) => {
      return Math.round(value * Math.pow(10, n) ) / Math.pow(10, n);
    },
    // NumberFormat utility for HighCharts
    numberFormatter: (point, measure_like) => {
      if (measure_like.value_format) {
        const symbolRegex = /^([^0#,.]+)/g;
        const symbol = measure_like.value_format.match(symbolRegex);
        
        const numberRegex = /([0#,.]+)/g;
        const formatString = measure_like.value_format.match(numberRegex)[0].split('.');
        const decimalPoint = formatString.length > 1 ? formatString[1].length : 0

        const unitRegex = /([^0#,.]+)$/g;
        const unitString = measure_like.value_format.match(unitRegex);

        const retVal = unitString?.includes("%") ? point*100: point;
        const formattedValue = []
        if (symbol) formattedValue.push(symbol[0]);
        formattedValue.push(Highcharts.numberFormat(retVal, decimalPoint, ".", ","));
        if (unitString) formattedValue.push(unitString[0]);

        return formattedValue.join('');

      } else {
        return Highcharts.numberFormat(point, -1, ".", ",")
      }
    }
}

export const ColorPallet = {
  Shoreline: ["#1A73E8", "#12B5CB", "#E52592", "#E8710A", "#F9AB00", "#7CB342", "#9334E6", "#80868B", "#079c98", "#A8A116", "#EA4335", "#FF8168"],
  BoardWalk: ["#3EB0D5", "#B1399E", "#C2DD67", "#592EC2", "#4276BE", "#72D16D", "#FFD95F", "#B32F37", "#9174F0", "#E57947", "#75E2E2", "#FBB555"],
  Breeze: ["#FCCF41", "#7CC8FA", "#f56776", "#10C871", "#FD9577", "#9E7FD0", "#AEC8C1", "#ACE9F5", "#A5EF55", "#C8A7F9", "#F29ED2", "#FDEC85"]
}