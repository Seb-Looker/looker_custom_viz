
defaultTheme = `
    rect:hover {
        fill: orange;
    }
    
    #tooltip {
        position: absolute;
        width: auto;
        height: auto;
        padding: 5px;
        background-color: white;
        -webkit-border-radius: 4px;
        -moz-border-radius: 4px;
        border-radius: 4px;
        -webkit-box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
        -moz-box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
        box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.4);
        pointer-events: none;
        font-family: sans-serif;
        font-size: 12px;
    }
    
    #tooltip.hidden {
        display: none;
    }
    
    #tooltip p {
        margin: 0;
        font-family: sans-serif;
        font-size: 12px;
        line-height: 15px;
    }

    .textdiv {
        font-family: "Open Sans",Helvetica,Arial,sans-serif;
        font-size: 12px;
        pointer-events: none;
        overflow: none;
        white-space: nowrap;
    }
`

global_options = {
  showSubHeaders: {
    section: "Data",
    type: "boolean",
    label: "Show Sub Headers",
    default: "true"
  },
  takeColorFromCellValue: {
    section: "Data",
    type: "boolean",
    label: "Color By Cell Value",
    default: "true"
  },
  cellColor: {
    section: "Data",
    type: "array",
    display: "colors",
    label: "Color Palette",
    default: ["#62bad4", "#a9c574", "#929292", "#9fdee0", "#1f3e5a", "#90c8ae", "#92818d", "#c5c6a6", "#82c2ca", "#cee0a0", "#928fb4", "#9fc190"]
  },
  breadcrumbs: {
    type: "array",
    default: [],
  }
};

convertQueryDatasetToVisData = function(data, queryResponse) {
    var vis_data = [];
    data.forEach(d => {
        var row = {};
        for (var [key, value] of Object.entries(d)) {
            row[key] = value.value;
        }
        vis_data.push(row);
    });
    return vis_data;
}

getHierarchy = function(queryResponse) {
    var hierarchy = [];
    queryResponse.fields.dimension_like.forEach(d => {
        hierarchy.push(d.name);
    });
    return hierarchy;
}

getMeasures = function(queryResponse) {
    var measures = [];
    queryResponse.fields.measure_like.forEach(d => {
        measures.push(d.name);
    })
    return measures;
}

getNewConfigOptions = function(dimensions, measures) {
    new_options = global_options;

    size_by_options = [];
    for (var i = 0; i < measures.length; i++) {
        option = {};
        option[measures[i]] = i.toString();
        size_by_options.push(option);
    }
    size_by_options.push({"Count of Rows": "count_of_rows"});

    new_options["sizeBy"] = {
        section: "Data",
        type: "string",
        label: "Size By",
        display: "select",
        values: size_by_options,
        default: "0",
    }

    color_by_options = [];
    for (var i = 0; i < dimensions.length; i++) {
        option = {};
        option[dimensions[i].label] = dimensions[i].name;
        color_by_options.push(option)
    }

    new_options["colorBy"] = {
        section: "Data",
        type: "string",
        label: "Color By",
        display: "select",
        values: color_by_options,
        default: "0",
    }

    return new_options;
}

looker.plugins.visualizations.add({
    options: {
      showSubHeaders: {
        section: "Data",
        type: "boolean",
        label: "Show Sub Headers",
        default: "true"
      },
      breadcrumbs: {
        type: "array",
        default: [],
      }
    },

    create: function(element, config) {
        console.log("create() called");
        this.style = document.createElement('style');
        document.head.appendChild(this.style);

        this.container = d3.select(element)
            .append("div")
            .attr("id", "treemapContainer")

        this.tooltip = d3.select(element)
            .append("div")
            .attr("class", "hidden")
            .attr("id", "tooltip")
    },

    updateAsync: function(data, element, config, queryResponse, details, done) {
        console.log("updateAsync() called");
        this.clearErrors();
        this.style.innerHTML = defaultTheme;
        console.log("#data\n", JSON.stringify(data, null, 2));
        console.log("#config\n", JSON.stringify(config, null, 2));
        console.log("#queryResponse\n", JSON.stringify(queryResponse, null, 2));


        var vis = this;

        var margin = {top: 20, right: 0, bottom: 0, left: 0};
        var chartWidth = element.clientWidth;
        var chartHeight = element.clientHeight - 16;

        var headerHeight = margin.top;
        var headerColor = "orange";
        var number_of_headers = 2;

        var current_branch;

        var dimensions = queryResponse.fields.dimension_like;
        var measures = queryResponse.fields.measure_like;
        
        vis_data = convertQueryDatasetToVisData(data, queryResponse);
        console.log("Treemap Data", vis_data);

        var hierarchy = getHierarchy(queryResponse);
        console.log("Hierarchy", hierarchy);

        var measures = getMeasures(queryResponse);
        console.log("Measures", measures);

        new_options = getNewConfigOptions(dimensions, measures);
        vis.trigger("registerOptions", new_options);
        console.log("colors", config["cellColor"]);
        console.log("color by", config["colorBy"]);

        var colorScale = d3.scaleOrdinal()
                            .range(config["cellColor"]);

        var treemap = d3.treemap()
            .size([chartWidth, chartHeight])
            .padding((d) => {
                return d.depth === 1 ? 2 : 0
            })
            .paddingTop((d) => {
                if (config.showSubHeaders) {
                    return d.depth < number_of_headers ? 16 : 0
                } else {
                    return d.depth === 0 ? 16 : 0
                }
            })
            .round(true);

        var update_current_branch = function(branch, keys) {
            if (keys.length === 0) {
                console.log("...returning final branch", branch);
                current_branch = branch;
            } else {
                var key = keys.shift();

                for (var value in branch.values) {
                    if (branch !== undefined) {
                        if (branch.values[value].key === key) {
                            branch = update_current_branch(branch.values[value], keys);
                        }
                    }
                }
            };
        }

        var get_size = function(d) {
            if (config["sizeBy"] == "count_of_rows") {
                return !d.key ? 1 : 0;
            } else {
                idx = Number(config["sizeBy"]);
                return parseFloat(d[measures[idx]]);    
            }
        }

        var get_color = function(d) {
            if (d.height === 0) {
                if (config.takeColorFromCellValue) {
                    return d.data[config["colorBy"]];
                } else {
                    return colorScale(d.data[config["colorBy"]]);
                }
            } else if (d.depth === 0) {
                return headerColor;
            } else {
                return "AliceBlue";
            }
        }

        var get_cell_text = function(d) {
            if (d.depth === 0) {
                if (config.breadcrumbs.length === 0) {
                    cell_string = " – Top Level: click on cells to zoom in, this bar to zoom out – "    
                } else {
                    cell_string = config.breadcrumbs.join(" – ")
                }
                
            } else if (d.depth < number_of_headers && config.showSubHeaders) {
                cell_string = d.data.key;
            } else if (d.height === 0) {
                if (config["sizeBy"] === "count_of_rows") {
                    cell_string = "";
                } else {
                    idx = Number(config["sizeBy"]);
                    cell_string = d.data[measures[idx]];                    
                }
            } else {
                cell_string = "";
            }

            return cell_string
        }

        var get_tooltip = function(d) {
            var tiptext = "";
            if (d.height === 0) {
                for (var prop in hierarchy) {
                    tiptext += "<p><em>" + hierarchy[prop] + ":</em> " + d.data[hierarchy[prop]] + "</p>";
                }

                for (var measure in measures) {
                    tiptext += "<p><em>" + measures[measure] + ":</em> " + d.data[measures[measure]] + "</p>";
                }
            } else {
                tiptext += d.data.key;
            };
            
            return tiptext;
        }

        var create_treemap = function(data) {
            var nested_data = d3.nest();
            dimensions.forEach(dim => 
                nested_data = nested_data.key(d => d[dim.name]));
            nested_data = nested_data.entries(data);
            nested_data = {
                "key": "root",
                "values": nested_data,
            }

            var root = treemap(
                d3.hierarchy(nested_data, d => d.values)
                  .sum(d => get_size(d))
                  .sort(function(a, b) {return b.height - a.height || get_size(b) - get_size(a)})
            );

            display_chart(root);

            function display_chart(d) {
                console.log("Displaying chart for", d.data.key);
                console.log("Current breadcrumbs:", config.breadcrumbs);
                console.log("Current treemap:", d);

                d3.select("#treemapSVG").remove();

                var svg = d3.select("#treemapContainer")
                            .append("svg")
                            .attr("id", "treemapSVG")
                            .attr("width", chartWidth)
                            .attr("height", chartHeight);

                var treemapArea = svg.append("g")
                    .datum(d)
                    .attr("class", "treemapArea");

                var treemapCells = treemapArea.selectAll("g")
                    .data(root.descendants())
                    .enter()

                treemapCells.append("rect")
                    .attr("x", d => d.x0)
                    .attr("y", d => d.y0)
                    .attr("width", d => d.x1 - d.x0)
                    .attr("height", d => d.y1 - d.y0)
                    .attr("fill", d => get_color(d))
                    .attr("stroke", "AliceBlue")

                    .on("mouseover", function(d) {
                        //Get this bar's x/y values, then augment for the tooltip
                        var xPosition = parseFloat(d3.select(this).attr("x")) + 50;
                        var yPosition = parseFloat(d3.select(this).attr("y")) + 50;

                        //Update the tooltip position and value
                        d3.select("#tooltip")
                            .style("left", xPosition + "px")
                            .style("top", yPosition + "px")                     
                            .html(get_tooltip(d));
                   
                        //Show the tooltip
                        d3.select("#tooltip").classed("hidden", false);
                    })
                    .on("mouseout", function() {
                        //Hide the tooltip
                        d3.select("#tooltip").classed("hidden", true);
                    })

                    .on("click", zoom)

                treemapCells.append("foreignObject")
                    .attr("x", d => d.x0 + 3)
                    .attr("y", d => d.y0)
                    .attr("width", d => d.x1 - d.x0 - 3)
                    .attr("height", d => d.y1 - d.y0)
                    .attr("fill", '#bbbbbb')
                    .attr("class", "foreignobj")
                    .attr("pointer-events", "none")
                    .attr("white-space", "nowrap")
                  .append("xhtml:div")
                    .html(d => get_cell_text(d))
                    .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS
            
                function zoom(d) {
                    if (d.depth === 0) {
                        console.log("zoom up called for");
                        if (config.breadcrumbs.length === 0) {
                            console.log("zoom cancelled, already at root node")
                        } else {
                            config.breadcrumbs.pop();
                            console.log("zoom up to (breadcrumbs):", config.breadcrumbs);
                            
                            update_current_branch(nested_data, config.breadcrumbs.slice(0));
                            console.log("current_branch:", current_branch);

                            root = treemap(d3.hierarchy(current_branch, d => d.values)
                                .sum(d => get_size(d)))
                            display_chart(root);
                        }
                    } else {
                        while (d.depth > 1) {
                            console.log("depth:", d.depth);
                            d = d.parent;
                        }
                        config.breadcrumbs.push(d.data.key);
                        console.log("zoom down to (breadcrumbs):", config.breadcrumbs);
                        root = treemap(d3.hierarchy(d.data, d => d.values)
                            .sum(d => get_size(d))
                        );
                        
                        display_chart(root);
                    }
                }
            }
        }
        
        create_treemap(vis_data);
        done();
    }
});