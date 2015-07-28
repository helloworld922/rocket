/**
 * removes all whitespaces from string
 * @returns
 */
String.prototype.killWhiteSpace = function() {
  return this.replace(/\s/g, '');
};

function getMetricScale(val, digits)
{
  // only deal with absolute value
  var working = Math.abs(val);
  var scale = 1;
  var term = '';
  if(working < 1e-15 * Math.pow(10, -digits))
  {
    // assume 0
    return {scale: 0,
            term: ''
           };
  }
  else if(working < 1e-12)
  {
    // femto
    scale = 1e15;
    term = 'f';
  }
  else if (working < 1e-9)
  {
    // pico
    scale = 1e12;
    term = 'p';
  }
  else if (working < 1e-6)
  {
    // nano
    scale = 1e9;
    term = 'n';
  }
  else if (working < 1e-3)
  {
    // micro
    scale = 1e6;
    term = 'u';
  }
  else if (working < 1)
  {
    // milli
    scale = 1e3;
    term = 'm';
  }
  else if (working < 1000)
  {
    // unit
    scale = 1;
    term = '';
  }
  else if (working < 1e6)
  {
    // kilo
    scale = 1e-3;
    term = 'k';
  }
  else if (working < 1e9)
  {
    // mega
    scale = 1e-6;
    term = 'Meg';
  }
  else
  {
    // giga
    scale = 1e-9;
    term = 'G';
  }
  return {
    scale: scale,
    term: term
  };
}


/**
 * Converts a base metric value to a string with the nearest metric scale.
 * @param val
 * @param digits (13 if try to include all)
 */
function toMetric(val, digits)
{
  var metric = getMetricScale(val, digits);
  return (val * metric.scale).toFixed(digits).replace(/(.\d*?)0+$/, '$1').replace(/\.$/,'') + metric.term;
}

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

/**
 * Parses a string text input with SPICE-like metric scales (case insensitive).
 * 
 * Allowed scales:
 * 
 * f - femto
 * p - pico
 * n - nano
 * u - micro
 * m - milli
 * k - kilo
 * Meg - Mega
 * G - giga
 * 
 * @param text
 */
function parseMetric(text)
{
  // strip all whitespace and make lowercase
  text = text.killWhiteSpace().toLocaleLowerCase();
  if(text.endsWith('f'))
  {
    return parseFloat(text.slice(0, -1)) * 1e-15;
  }
  else if(text.endsWith('p'))
  {
    return parseFloat(text.slice(0, -1)) * 1e-12;
  }
  else if(text.endsWith('n'))
  {
    return parseFloat(text.slice(0, -1)) * 1e-9;
  }
  else if(text.endsWith('u'))
  {
    return parseFloat(text.slice(0, -1)) * 1e-6;
  }
  else if(text.endsWith('m'))
  {
    return parseFloat(text.slice(0, -1)) * 1e-3;
  }
  else if(text.endsWith('k'))
  {
    return parseFloat(text.slice(0, -1)) * 1e3;
  }
  else if(text.endsWith('meg'))
  {
    return parseFloat(text.slice(0, -3)) * 1e6;
  }
  else if(text.endsWith('g'))
  {
    return parseFloat(text.slice(0, -1)) * 1e9;
  }
  // bare
  return parseFloat(text);
}

// cheaty way to get text height
function textHeight(context)
{
  return context.measureText('M').width;
}

function arrayMin(arr) {
  var len = arr.length, min = Infinity;
  while (len--) {
    if (arr[len] < min) {
      min = arr[len];
    }
  }
  return min;
};

function arrayMax(arr) {
  var len = arr.length, max = -Infinity;
  while (len--) {
    if (arr[len] > max) {
      max = arr[len];
    }
  }
  return max;
};

function minmax(arr)
{
  var len = arr.length, min=Infinity, max=-Infinity;
  while(len--)
  {
    if(arr[len] > max)
    {
      max = arr[len];
    }
    if(arr[len] < min)
    {
      min = arr[len];
    }
  }
  return [min, max];
};

var Plot = function Plot(graph, plotElement, strokeStyle)
{
  this.graph = graph;
  this.plotElement = plotElement;
  this.strokeStyle = strokeStyle;
  
  // get the transformation matrix from graph coordinates to canvas coordinates
  this.transformToCanvas = function transformToCanvas(graph)
  {
    var dx = graph.plotWidth / (graph.maxx - graph.minx);
    var dy = -graph.plotHeight / (graph.maxy - graph.miny);
    var ox = graph.leftOffset;
    var oy = graph.bottomOffset;
    return {dx: dx,
            dy: dy,
            ox: ox,
            oy: oy,
            minx: graph.minx,
            miny: graph.miny};
  };
  
  this.map = function map(x, y, transform)
  {
    return {x: transform.dx * (x-transform.minx) + transform.ox,
            y: transform.dy * (y-transform.miny) + transform.oy};
  };

  this.scale_fit = function scale_fit(x, y)
  {
    // find min/max in x and y
    var mm = minmax(x);
    this.graph.minx = mm[0];
    this.graph.maxx = mm[1];
    var mm = minmax(y);
    this.graph.miny = mm[0];
    this.graph.maxy = mm[1];
    this.graph.update();
  };
  
  // plot x/y data
  this.plot = function plot(x, y)
  {
    //this.scale_fit(x,y);
    //this.graph.update();
    var context = this.plotElement.getContext('2d');
    context.save();
    // clear plot area
    context.clearRect(0, 0, this.graph.width, this.graph.height);
    
    var transform = this.transformToCanvas(this.graph);
    
    context.beginPath();
    // get start point
    var point = this.map(x[0], y[0], transform);
    context.strokeStyle = this.strokeStyle;
    context.lineWidth = 2;
    context.moveTo(point.x, point.y);
    var end = y.length
    for(var i = 1; i < end; ++i)
    {
      point = this.map(x[i], y[i], transform);
      context.lineTo(point.x, point.y);
    }
    context.stroke();
    context.restore();
  };
};

var Graph = function Graph(element, xlabel, ylabel, xunits, yunits, minx, maxx, miny, maxy, xdivs, ydivs)
{
  this.element = element;
  this.xlabel = xlabel;
  this.ylabel = ylabel;
  this.minx = minx;
  this.maxx = maxx;
  this.miny = miny;
  this.maxy = maxy;
  this.xdivs = xdivs;
  this.ydivs = ydivs;
  this.xunits = xunits;
  this.yunits = yunits;
  
  this.labelFont = '13px sans-serif';
  this.divFont = '11px sans-serif';
  // px around everything, left, top, right, bottom
  this.border = [4, 16, 16, 4];
  // px between label and div text
  this.labelOffset = 8;
  // px between div text and axis line
  this.divOffset = 8;
  
  this.gridColor = 'rgba(180, 180, 180, 0.5)';
  
  // should call on update
  this.updateMeasures = function updateMeasures()
  {
    var context = this.element.getContext('2d');
    this.dx = Math.abs(this.maxx - this.minx) / (this.xdivs-1);
    this.dy = Math.abs(this.maxy - this.miny) / (this.ydivs-1);
    this.width = this.element.width;
    this.height = this.element.height;
    context.save();
    context.font = this.labelFont;
    this.labelHeight = textHeight(context);
    this.divHeight = textHeight(context);
    this.bottomOffset = this.border[3] + this.labelHeight + this.labelOffset + this.divHeight + this.divOffset;
    this.plotHeight = this.height - this.bottomOffset - this.border[1];
    // compute how much space ydiv text takes up
    context.font = this.divFont;
    this.divHeight = textHeight(context);
    // determine how much space we need for ydiv text
    var yscale = getMetricScale(Math.max(Math.abs(this.miny), Math.abs(this.maxy)), 1);
    this.yDivWidth = 0;
    for(var i = 0; i < this.ydivs; ++i)
    {
      var text = ((i * this.dy + this.miny) * yscale.scale).toFixed(1).replace(/(.\d*?)0+$/, '$1').replace(/\.$/,'');
      var tLength = context.measureText(text).width;
      if(tLength > this.yDivWidth)
      {
        this.yDivWidth = tLength;
      }
    }
    
    this.leftOffset = this.border[0] + this.labelHeight + this.labelOffset + this.yDivWidth + this.divOffset;
    this.bottomOffset = this.border[1]+this.plotHeight;
    this.plotWidth = this.width - this.leftOffset - this.border[2];
    context.restore();
  };
  
  this.update = function update()
  {
    // get context
    var context = this.element.getContext('2d');
    this.updateMeasures();
    // clear area
    context.clearRect(0, 0, this.width, this.height);
    
    // draw the ylabel
    context.save();
    context.font = this.labelFont;
    
    // ylabel is rotated
    context.rotate(-Math.PI / 2);
    context.translate(-this.plotHeight - this.border[1], this.border[0] + this.labelHeight);
    
    var yscale = getMetricScale(Math.max(Math.abs(this.miny), Math.abs(this.maxy)), 1);
    var ylabel = this.ylabel;
    if(this.yunits === undefined)
    {
      if(yscale.term != '')
      {
        ylabel = this.ylabel + ' (' + yscale.term + ')';
      }
    }
    else
    {
      ylabel = this.ylabel + ' (' + yscale.term + this.yunits + ')';
    }
    context.fillText(ylabel, (this.plotHeight) / 2 - context.measureText(ylabel).width / 2, 0);
    context.restore();
    
    // draw ydiv text
    context.save();
    context.font = this.divFont;
    
    context.translate(this.border[0] + this.labelHeight + this.labelOffset + this.yDivWidth, this.border[1]);
    for(var i = 0; i < this.ydivs; ++i)
    {
      var text = ((i * this.dy + this.miny) * yscale.scale).toFixed(1).replace(/(.\d*?)0+$/, '$1').replace(/\.$/,'');
      var tLength = context.measureText(text).width;
      context.fillText(text, -tLength, Math.round(this.plotHeight - this.plotHeight * i / (this.ydivs - 1) + this.divHeight / 2 - 1));
    }
    context.restore();
    
    // draw xlabel
    context.save();
    context.font = this.labelFont;
    
    var xscale = getMetricScale(Math.max(Math.abs(this.minx), Math.abs(this.maxx)), 1);
    var xlabel = this.xlabel;
    if(this.xunits === undefined)
    {
      if(xscale.term != '')
      {
        xlabel = this.xlabel + ' (' + xscale.term + ')';
      }
    }
    else
    {
      xlabel = this.xlabel + ' (' + xscale.term + this.xunits + ')';
    }
    
    context.translate(this.leftOffset, this.height - this.border[3]);
    context.fillText(xlabel, this.plotWidth / 2 - context.measureText(xlabel).width / 2, 0);
    context.restore();
    
    // draw xdiv text
    context.save();
    context.font = this.divFont;
    context.translate(this.leftOffset, this.height - this.border[3] - this.labelHeight - this.labelOffset);
    for(var i = 0; i < this.xdivs; ++i)
    {
      var text = ((i * this.dx + this.minx) * xscale.scale).toFixed(1).replace(/(.\d*?)0+$/, '$1').replace(/\.$/,'');
      var tLength = context.measureText(text).width;
      context.fillText(text, Math.round(this.plotWidth * i / (this.xdivs - 1) - tLength / 2), 0);
    }
    context.restore();
    
    // draw plot border
    context.save();
    context.beginPath();
    context.moveTo(this.leftOffset, this.border[1]);
    context.lineTo(this.leftOffset, this.border[1] + this.plotHeight);
    context.lineTo(this.width - this.border[2], this.border[1] + this.plotHeight);
    context.lineTo(this.width - this.border[2], this.border[1]);
    context.lineTo(this.leftOffset, this.border[1]);
    context.stroke();
    context.restore();
    
    // draw plot grid
    context.save();
    context.strokeStyle = this.gridColor;
    context.beginPath();
    for(var i = 1; i < this.ydivs - 1; ++i)
    {
      context.moveTo(this.leftOffset, Math.round(this.border[1] + this.plotHeight - this.plotHeight * i / (this.ydivs - 1)));
      context.lineTo(this.width - this.border[2], Math.round(this.border[1] + this.plotHeight - this.plotHeight * i / (this.ydivs - 1)));
    }
    for(var i = 1; i < this.xdivs - 1; ++i)
    {
      context.moveTo(Math.round(this.leftOffset + this.plotWidth * i / (this.xdivs - 1)), this.border[1]);
      context.lineTo(Math.round(this.leftOffset + this.plotWidth * i / (this.xdivs - 1)), this.border[1] + this.plotHeight);
    }
    context.stroke();
    context.restore();
  };
};

var Sim = function Sim(init_fun, step_fun, trajPlot)
{
  this.init_fun = init_fun;
  this.step_fun = step_fun;
  this.trajPlot = trajPlot;
  this.t = 0;
  this.properties = {};
  this.plots = [];
  
  this.add_property = function add_property(name, callback, default_val, unit)
  {
    this.properties[name] = {'callback': callback,
                             'default_val': default_val,
                             'val': default_val};
    // find element to add property to
    var props = document.getElementById('properties');
    var row = document.createElement('tr');
    var header = document.createElement('th');
    header.setAttribute('class', 'rAlign');
    header.appendChild(document.createTextNode(name));
    row.appendChild(header);
    var inp_td = document.createElement('td');
    var inp = document.createElement('input');
    inp.setAttribute('id', 'props_'+name);
    inp.setAttribute('class', 'rAlign');
    inp.setAttribute('type', 'text');
    inp.setAttribute('value', toMetric(default_val, 12));
    inp.setAttribute('onchange', 'sim.update_property(this);');
    inp_td.appendChild(inp);
    if(unit != null)
    {
      inp_td.appendChild(document.createTextNode(unit));
    }
    row.appendChild(inp_td);
    props.appendChild(row);
  };

  this.update_property = function update_property(elem)
  {
    var val = parseMetric(elem.value);
    if(!isNaN(val))
    {
      // try calling update handler
      var handler = this.properties[elem.id.substring(6)]
      var res = handler['callback'](val);
      if(res[0])
      {
        handler['val'] = res[1];
      }
    }
    elem.value = toMetric(handler['val'], 12);
  };

  this.reset = function reset()
  {
    this.t = 0;
    this.x = [0];
    this.y = [0];
    this.init_fun(this);
  };
};
