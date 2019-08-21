// Visualisation adapted by Looker based on the work done by Imagination (https://www.imagination.com/)
// Credit to Imagination Group Limited

looker.plugins.visualizations.add({
  id: 'guinness',
  label: 'Guinness',
  options: {
    colorRange: {
      type: 'array',
      label: 'Color Ranges',
      section: 'Style',
      placeholder: '#fff, red, etc...'
    }
  },

  handleErrors: function(data, resp) {

    // insert IF statements that return false when not met

    var min_mes, max_mes, min_dim, max_dim, min_piv, max_piv;
    min_mes = 1;
    max_mes = 1;
    min_dim = 1;
    max_dim = 1;
    min_piv = 0;
    max_piv = 0;

    if (resp.fields.pivots.length > max_piv) {
      this.addError({
        group: 'pivot-req',
        title: 'Incompatible Data',
        message: 'No pivot is allowed'
      });
      return false;
    } else {
      this.clearErrors('pivot-req');
    }

    if (resp.fields.pivots.length < min_piv) {
      this.addError({
        group: 'pivot-req',
        title: 'Incompatible Data',
        message: 'Add a Pivot'
      });
      return false;
    } else {
      this.clearErrors('pivot-req');
    }

    if (resp.fields.dimensions.length > max_dim) {
      this.addError({
        group: 'dim-req',
        title: 'Incompatible Data',
        message: 'You need ' + min_dim + ' to ' + max_dim + ' dimensions'
      });
      return false;
    } else {
      this.clearErrors('dim-req');
    }

    if (resp.fields.dimensions.length < min_dim) {
      this.addError({
        group: 'dim-req',
        title: 'Incompatible Data',
        message: 'You need ' + min_dim + ' to ' + max_dim + ' dimensions'
      });
      return false;
    } else {
      this.clearErrors('dim-req');
    }

    if (resp.fields.measure_like.length > max_mes) {
      this.addError({
        group: 'mes-req',
        title: 'Incompatible Data',
        message: 'You need ' + min_mes + ' to ' + max_mes + ' measures'
      });
      return false;
    } else {
      this.clearErrors('mes-req');
    }

    if (resp.fields.measure_like.length < min_mes) {
      this.addError({
        group: 'mes-req',
        title: 'Incompatible Data',
        message: 'You need ' + min_mes + ' to ' + max_mes + ' measures'
      });
      return false;
    } else {
      this.clearErrors('mes-req');
    }

    // If no errors found, then return true
    return true;
  },


  create: function(element, settings) {

    // clear it
    d3.select(element)
      .selectAll("*").remove();

    // Add stuff to your element

    d3.select(element)
      .append("svg")
      .attr("id", "devicevis")
      .attr('width', '100%')
      .attr('height', '100%');

  },

  update: function(data, element, settings, resp) {


    if (!this.handleErrors(data, resp)) return; // Check for errors!

    // Height and Width
    h = $(element).height();
    w = $(element).width();

    var graphSettings = {
      deviceBGImgPath: [
        "M51.75,54.939h24.311C79.893,54.939,83,51.833,83,48V6.939C83,3.106,79.893,0,76.061,0H6.939 C3.106,0,0,3.106,0,6.939V48c0,3.832,3.106,6.939,6.939,6.939l24.811,0.006v9.587l-3.938,2.265c0,0-0.964,2.142,1.542,2.142h26.021 c0,0,2.083-1.179,1.12-2.142c-0.964-0.964-4.745-2.458-4.745-2.458V54.939z M78,43.223c0,2.052-1.664,3.716-3.716,3.716H8.716 C6.664,46.939,5,45.275,5,43.223V8.655c0-2.052,1.664-3.716,3.716-3.716h65.568C76.336,4.939,78,6.603,78,8.655V43.223z",
        "M36.861,0H7.139C3.196,0,0,3.196,0,7.139v54.366 c0,3.943,3.196,7.338,7.139,7.338h29.721c3.943,0,7.139-3.196,7.139-7.139V7.139C44,3.196,40.803,0,36.861,0z M18,2.842h8 c0.552,0,1,0.448,1,1c0,0.552-0.448,1-1,1h-8c-0.552,0-1-0.448-1-1C17,3.29,17.448,2.842,18,2.842z M22.5,63.842 c-1.381,0-2.5-1.119-2.5-2.5c0-1.381,1.119-2.5,2.5-2.5s2.5,1.12,2.5,2.5C25,62.723,23.881,63.842,22.5,63.842z M39,54.842H5v-48 h34V54.842z",
        "M72.799,0H7.201C3.224,0,0,3.224,0,7.201v46.598 C0,57.776,3.224,61,7.201,61h65.598C76.776,61,80,57.776,80,53.799V7.201C80,3.224,76.776,0,72.799,0z M70,54H7V7h63V54z M74.5,34.038c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5c1.38,0,2.5,1.119,2.5,2.5S75.88,34.038,74.5,34.038z"
      ],
      deviceWidths: [72, 32, 63], // desktop, mobile, tablet (screen sizes)
      deviceHeights: [40, 45, 45],
      devicePadding: [5, 5, 7],
      deviceMargin: 35,
    };

    var dim = resp.fields.dimensions[0].name,
      mes = resp.fields.measures[0].name;


    var totalUsers = 0;
    for (var i = 2; i >= 0; i--) {
      totalUsers += data[i][mes].value;
    };

    // Create % values
    var source = []
    for (var i = 2; i >= 0; i--) {
      source[i] = Math.round((data[i][mes].value / totalUsers) * 100);
    };

    var svg = d3.select("#devicevis");

    // Clear the svg
    svg.selectAll("*").remove();

    // Create graph!
    var graph = svg.selectAll("g")
      .data(source);

    var xPos = 0;

    // create groups
    var groups = graph.enter()
      .append("g")
      .attr("fill", "#000")
      .attr("transform", function(d, i) {
        var leftMargin = i === 0 ? 0 : graphSettings.deviceMargin;
        var w;

        if (i > 0) {
          w = graphSettings.deviceWidths[i - 1] + (graphSettings.devicePadding[i - 1] * 2) + leftMargin;
          xPos += w;
        }

        return "translate(" + xPos + ",0)";
      });

    // Create graph on screen
    var rect = groups.append("rect")
      .attr('class', 'bar')
      .attr("x", function(d, i) {
        return graphSettings.devicePadding[i] + (d3.select(element).node().getBoundingClientRect().width / 2) - 127;
      })
      // .attr("y", 5)
      .attr("y", (d3.select(element).node().getBoundingClientRect().height / 2) - 35)
      .attr("width", 0)
      .attr("height", function(d, i) {
        var h = graphSettings.deviceHeights[i] + 5;

        return h;
      })
      .style("fill", settings.colorRange || ['#808080']);

    // Create pattern
    groups.append("defs")
      .append('pattern')
      .attr("x", (d3.select(element).node().getBoundingClientRect().width / 2) - 127)
      .attr("y", (d3.select(element).node().getBoundingClientRect().height / 2) - 40)
      .attr('id', function(d, i) {
        return "device-" + i;
      })
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', function(d, i) {
        var w = graphSettings.deviceWidths[i] + (graphSettings.devicePadding[i] * 2);
        return w + 10;
      })
      .attr('height', 300)
      .append("path")
      .attr("d", function(d, i) {
        return graphSettings.deviceBGImgPath[i];
      })
      .attr("fill", "#CCCCCC");

    // Create BG rectangle for icons
    var bg = groups.append("rect")
      .attr("x", (d3.select(element).node().getBoundingClientRect().width / 2) - 127)
      .attr("y", (d3.select(element).node().getBoundingClientRect().height / 2) - 40)
      .attr("width", function(d, i) {
        var w = graphSettings.deviceWidths[i] + (graphSettings.devicePadding[i] * 2);
        return w + 10;
      })
      .attr("height", function(d, i) {

        return 150;
      })
      .style("fill", function(d, i) {
        var id = "#device-" + i;
        return 'url(' + id + ')';
      });

    // Add text
    groups.append("text")
      .attr("y", (d3.select(element).node().getBoundingClientRect().height / 2) + 60)
      .attr("text-anchor", "left");


    // Add text
    groups.select("text")
      .data(source)
      .text(function(d, i) {
        var num = source[i];
        num = isNaN(num) ? 0 : num;
        return num + "%";
      })
      .attr("x", function(d, i) {
        var padding = graphSettings.devicePadding[i];
        var deviceWidth = graphSettings.deviceWidths[i] + (padding * 2);
        var textWidth = d3.select(this).node().getBBox().width;

        return (deviceWidth / 2) - (textWidth / 2) + (d3.select(element).node().getBoundingClientRect().width / 2) - 127;
      });

    // Animate bars
    groups.data(source)
      .select('rect').transition().duration(1000)
      .delay(function(d, i) {
        return i + 1 * 150;
      })
      .ease("elastic")
      .attr("width", function(d, i) {
        //var w = (graphSettings.deviceWidths[i] * d.current.metrics.new_users.percent) / 100;
        var w = (graphSettings.deviceWidths[i] * source[i]) / 100;
        w = isNaN(w) ? 0 : w;
        return w;
      });

  }
})