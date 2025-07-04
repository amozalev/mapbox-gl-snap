# MapboxSnap

[Demo Page](https://66e442a2bfe4a30521a9df2f--mapbox-gl-snap.netlify.app/)

`MapboxSnap` is a utility that works with Mapbox GL JS to enable snapping to specific geometric points, edges, or midpoints when drawing on the map. This library is designed to enhance accuracy during drawing by allowing users to snap to nearby features easily.

![mapbox-gl-snap](https://akilic.com/photos/blog/23/mapbox-gl-snap3-gif.gif)

## Installation

```bash
npm install mapbox-gl @mapbox/mapbox-gl-draw @turf/turf mapbox-gl-snap
```

## Importing the Library

Depending on whether you are using, Browser(`purejs`) ES Modules (`import`) or CommonJS (`require`), you should import the `MapboxSnap` library as follows:


- **For Browser (`purejs`)**:
  ```javascript
  <script src="https://cdn.jsdelivr.net/gh/gislayer/mapbox-gl-snap/dist/purejs/mapbox-gl-snap.js"></script>
  ```

- **For ES Modules (`import`)**:
  ```javascript
  import MapboxSnap from 'mapbox-gl-snap/dist/esm/MapboxSnap';
  ```

- **For CommonJS (`require`)**:
  ```javascript
  const MapboxSnap = require('mapbox-gl-snap/dist/cjs/MapboxSnap');
  ```

## Features

- **Layer-Based Snapping**: Operates on specific layers, allowing you to snap only to the geometries within these layers.
- **Rule-Based Snapping**: Allows snapping based on rules such as vertex, edge, or line, polygon edge midpoint. The snapping process respects these rules in order.
- **Dynamic Snap Radius**: The snap radius is configurable, allowing control over how close the points need to be for snapping to occur.

## TypeScript Declaration

If you're using TypeScript, you might need to manually add the following declaration for the `mapbox-gl-snap` module:

```typescript
declare module 'mapbox-gl-snap' {
  import {
    Map
  } from 'mapbox-gl';
  import MapboxDraw from '@mapbox/mapbox-gl-draw';
  import {
    FeatureCollection,
    Geometry
  } from 'geojson';

  export interface MapboxSnapOptions {
    layers: string[];
    rules: ('vertex' | 'edge' | 'midpoint')[];
    radius: number;
  }

  export interface MapboxSnapProps {
    map: Map;
    drawing: MapboxDraw;
    options: MapboxSnapOptions;
    status ? : boolean;
    onSnapped ? : Function;
  }

  class MapboxSnap {
    constructor(options: MapboxSnapProps);
    setStatus(status: boolean): void;
    getMe(): MapboxSnap;
  }

  export default MapboxSnap;
}
```

## Usage

Below is an example of how to use the `MapboxSnap` library.

### 1. Creating the Map and Drawing Objects

First, you need to create a Mapbox GL JS map and add the `MapboxDraw` control for drawing.

```javascript
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxSnap from 'mapbox-gl-snap';

const map = new mapboxgl.Map({
  container: 'map',
  style: `mapbox://styles/mapbox/dark-v11`,
  center: [0, 0],
  zoom: 16,
  pitch: 30,
  bearing: 45,
});

map.on('style.load', () => {
  const drawing = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      polygon: true,
      line_string: true,
      point: true,
      trash: true,
    },
  });

  map.addControl(drawing);
  
  // Initialize MapboxSnap Library
  const mapboxSnap = new MapboxSnap({
    map: map,
    drawing: drawing,
    options: {
      layers: ['layer1', 'layer2'],  // Array of layer IDs to snap to
      radius: 15,  // Snap radius in pixels
      rules: ['vertex', 'midpoint', 'edge']  // Snap rules
    },
    onSnapped:(fc:FeatureCollection)=>{
      // use on here
    }
  });
});
```

### 2. Understanding Snap Rules

- **`layers`**: An array of layer IDs where the snapping will occur. The snapping is limited to geometries within these layers.
  
- **`rules`**: An array defining the snap rules, which are checked in order:
  - **`vertex`**: Snaps to the vertex points of the geometry.
  - **`midpoint`**: Snaps to the midpoint of lines or polygon edges.
  - **`edge`**: Snaps to the edges of lines.
  
  The rules are applied sequentially. For instance, with `rules: ['vertex', 'midpoint', 'edge']`, the snapping will first attempt to snap to a vertex. If a vertex is found, it will snap to that and stop. If not, it will proceed to check the middle and then the edge.

### 3. Customizing the Snap Process

When creating the `MapboxSnap` instance, you can customize the snap radius (`radius`) and rules (`rules`). The `radius` specifies how close a point must be to snap to it, measured in pixels.

```javascript
const mapboxSnap = new MapboxSnap({
  map: map,
  drawing: drawing,
  options: {
    layers: ['layer1', 'layer2'],  // Layers to snap to
    radius: 20,  // Snap radius in pixels
    rules: ['vertex', 'edge'],  // Only snap to vertices and edges
  },
  onSnapped:(fc:FeatureCollection)=>{
      // you can get snapped geometries
  }
});
```

## License


This project is licensed under the MIT License.

Author: Ali Kilic - ali.kilic@gislayer.com

Author Web Site : [Ali Kilic Blog Page](https://akilic.com)

Project GitHub : [mapbox-gl-snap](https://github.com/gislayer/mapbox-gl-snap)

Blog Page : [Read My Blog](https://akilic.com/blog/mapbox/mapbox-gl-js-snapping-geometries-layer-snap-module)
