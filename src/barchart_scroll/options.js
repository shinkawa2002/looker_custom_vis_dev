export const options = {
    series_positioning: {
        type: 'string',
        label: 'Series Positioning',
        section: 'Plot',
        default: 'g',
        display: 'radio',
        values: [
            {"Grouped": "g"},
            {"Stacked": "s"},
            {"Stacked Percentage": "p"}                
        ],
        order: 1
    },
    enable_scroll: {
        type: 'boolean',
        label: 'Scroll',
        section: 'Y'
    },
    number_of_categories: {
        type: 'number',
        label: 'Maximum Rows display',
        section: 'Y',
        default: 10,
        display: 'number',
        order: 2
    },
    hide_legend: {
        type: 'boolean',
        label: 'Hide Legend',
        default: false,
        section: "Plot",
        order: 3
    },
    legend_align: {
        type: 'string',
        label: 'Legend Align',
        section: 'Plot',
        default: 'center',
        display: 'radio',
        values: [
            {"Center": "center"},
            {"Left": "left"},
            {"Right": "right"}
        ],
        order: 4
    },
    show_full_field_name: {
        type: 'boolean',
        label: 'Show Full Field Name',
        default: false,
        section: "Series",
        order: 5
    },
    value_labels: {
        type: 'boolean',
        label: 'Value Labels',
        default: false,
        section: 'Values',
        order: 20
    },
}