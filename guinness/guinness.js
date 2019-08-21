// v0.05

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
      .attr("id", "guinness")
      .attr('width', '100%')
      .attr('height', '100%');

  },

  update: function(data, element, settings, resp) {


    if (!this.handleErrors(data, resp)) return; // Check for errors!

    // Height and Width
    h = $(element).height();
    w = $(element).width();

    var graphSettings = {
      guinnessBGImgPath: [
        "M51.75,54.939h24.311C79.893,54.939,83,51.833,83,48V6.939C83,3.106,79.893,0,76.061,0H6.939 C3.106,0,0,3.106,0,6.939V48c0,3.832,3.106,6.939,6.939,6.939l24.811,0.006v9.587l-3.938,2.265c0,0-0.964,2.142,1.542,2.142h26.021 c0,0,2.083-1.179,1.12-2.142c-0.964-0.964-4.745-2.458-4.745-2.458V54.939z M78,43.223c0,2.052-1.664,3.716-3.716,3.716H8.716 C6.664,46.939,5,45.275,5,43.223V8.655c0-2.052,1.664-3.716,3.716-3.716h65.568C76.336,4.939,78,6.603,78,8.655V43.223z"],
      guinnessWidths: [72], // desktop, mobile, tablet (screen sizes)
      guinnessHeights: [40],
      guinnessPadding: [5],
      guinnessMargin: 35,
    };

    var dim = resp.fields.dimensions[0].name,
      mes = resp.fields.measures[0].name;


    // var totalUsers = 0;
    // for (var i = 2; i >= 0; i--) {
    //   totalUsers += data[i][mes].value;
    // };


    // Create % values
    // var source = []
    // for (var i = 2; i >= 0; i--) {
    //   source[i] = Math.round((data[i][mes].value / totalUsers) * 100);
    // };

    var source = []
    source[0] = Math.round(data[0][mes].value);

    var svg = d3.select("#guinness");

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
        var leftMargin = i === 0 ? 0 : graphSettings.guinnessMargin;
        var w;

        if (i > 0) {
          w = graphSettings.guinnessWidths[i - 1] + (graphSettings.guinnessPadding[i - 1] * 2) + leftMargin;
          xPos += w;
        }

        return "translate(" + xPos + ",0)";
      });

    // Create graph on screen
    var rect = groups.append("rect")
      .attr('class', 'bar')
      .attr("x", function(d, i) {
        return graphSettings.guinnessPadding[i] + (d3.select(element).node().getBoundingClientRect().width / 2) - 127;
      })
      // .attr("y", 5)
      .attr("y", (d3.select(element).node().getBoundingClientRect().height / 2) - 35)
      .attr("width", 0)
      .attr("height", function(d, i) {
        var h = graphSettings.guinnessHeights[i] + 5;

        return h;
      })
      .style("fill", settings.colorRange || ['#808080']);

    // Create pattern
    groups.append("defs")
      .append('pattern')
      .attr("x", (d3.select(element).node().getBoundingClientRect().width / 2) - 127)
      .attr("y", (d3.select(element).node().getBoundingClientRect().height / 2) - 40)
      .attr('id', function(d, i) {
        return "guinness-" + i;
      })
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', function(d, i) {
        var w = graphSettings.guinnessWidths[i] + (graphSettings.guinnessPadding[i] * 2);
        return w + 10;
      })
      .attr('height', 300)
      .append("path")
      .attr("d", function(d, i) {
        return graphSettings.guinnessBGImgPath[i];
      })
      .attr("fill", "#CCCCCC");

    // Create BG rectangle for icons
    var bg = groups.append("rect")
      .attr("x", (d3.select(element).node().getBoundingClientRect().width / 2) - 127)
      .attr("y", (d3.select(element).node().getBoundingClientRect().height / 2) - 40)
      .attr("width", function(d, i) {
        var w = graphSettings.guinnessWidths[i] + (graphSettings.guinnessPadding[i] * 2);
        return w + 10;
      })
      .attr("height", function(d, i) {

        return 150;
      })
      .style("fill", function(d, i) {
        var id = "#guinness-" + i;
        return 'url(' + id + ')';
      });

    // // Add text
    // groups.append("text")
    //   .attr("y", (d3.select(element).node().getBoundingClientRect().height / 2) + 60)
    //   .attr("text-anchor", "left");


    // // Add text
    // groups.select("text")
    //   .data(source)
    //   .text(function(d, i) {
    //     var num = source[i];
    //     num = isNaN(num) ? 0 : num;
    //     return num + "%";
    //   })
    //   .attr("x", function(d, i) {
    //     var padding = graphSettings.guinnessPadding[i];
    //     var guinnessWidth = graphSettings.guinnessWidths[i] + (padding * 2);
    //     var textWidth = d3.select(this).node().getBBox().width;

    //     return (guinnessWidth / 2) - (textWidth / 2) + (d3.select(element).node().getBoundingClientRect().width / 2) - 127;
    //   });

    // Animate bars
    groups.data(source)
      .select('rect').transition().duration(1000)
      .delay(function(d, i) {
        return i + 1 * 150;
      })
      .ease("elastic")
      .attr("height", function(d, i) {
        //var w = (graphSettings.guinnessWidths[i] * d.current.metrics.new_users.percent) / 100;
        var h = (graphSettings.guinnessHeights[i] * source[i]) / 100;
        h = isNaN(h) ? 0 : h;
        return h;
      });

  }
})