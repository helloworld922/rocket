function init_physics(sim)
{
  // TODO: any physics initialization
  sim.vy = sim.properties['vy'].val;

  // plot initialization stuff hack
  sim.trajPlot.graph.minx = 0;
  sim.trajPlot.graph.miny = 0;
  sim.trajPlot.graph.maxx = sim.properties['maxx'].val;
  sim.trajPlot.graph.maxy = sim.properties['maxy'].val;
  sim.trajPlot.graph.update();
}

function step_physics(sim)
{
  // TODO: implement physics here
  var x = sim.x[sim.x.length-1];
  var y = sim.y[sim.y.length-1];
  var m = sim.properties['mass'].val;
  var g = sim.properties['g'].val;
  var vx = sim.properties['vx'].val;
  var dt = sim.properties['dt'].val;
  x += dt * vx;
  y += dt * sim.vy;
  sim.vy -= g * dt;
  sim.x.push(x);
  sim.y.push(y);
  sim.t += dt;
};

function pos_cb(val)
{
  return [val > 0, val];
}

function any_cb(val)
{
  return [true, val];
}

function update_maxx(val)
{
  sim.trajPlot.graph.maxx = val;
  sim.trajPlot.graph.update();
  return [true, val];
}

function update_maxy(val)
{
  sim.trajPlot.graph.maxy = val;
  sim.trajPlot.graph.update();
  return [true, val];
}

var simGraph = new Graph(document.getElementById('graph'), 'x', 'y', 'm', 'm', 0, 10, 0, 2, 11, 16);
// plot line style: #RRGGBB
var plot_style = "#000000";
var trajPlot = new Plot(simGraph, document.getElementById('traj'), plot_style);

var sim = new Sim(init_physics, step_physics, trajPlot);

// TODO: add GUI properties here
sim.add_property('mass', pos_cb, 1, 'kg');
sim.add_property('vx', any_cb, 1, 'm/s');
sim.add_property('vy', pos_cb, 10, 'm/s');
sim.add_property('g', pos_cb, 9.81, 'm/s^2');
sim.add_property('dt', pos_cb, 0.001, 's');

sim.add_property('maxx', update_maxx, 3, 'm');
sim.add_property('maxy', update_maxy, 6, 'm');

sim.reset();
