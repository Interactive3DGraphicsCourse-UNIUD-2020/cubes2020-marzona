# Cubes - 3Dint First Project

![A small preview](photos/showcase.gif)
### Author:
- Marzona Eugenio - 128623
- [Demo](https://interactive3dgraphicscourse-uniud-2020.github.io/cubes2020-marzona/)

## A brief description
The presented scene consists of a simple natural environment containing some procedurally generated vegetation and a small bonfire.
Using UI controls the user can cycle between night and day illumination condition and ingnite/put out a particle based flame.

The main sources of inspiration for this project were this [2D Animation](https://i.pinimg.com/originals/10/2b/e3/102be30f28f1e288229155e255b50bff.gif) (of which, sadly, I couldn't find out the author) and voxel-art dioramas.


## Included files
This repository includes:
* `./index.html` -> The HTML file that assembles the scene
* `./main.css` -> A stylesheet used to style UI Controls
* `./README.md` -> This file
* `./journal.md` -> A text document that describes, in broad terms, the creation process
* `./three/..` -> Local threejs library
* `./modules/..` -> GLSL Shaders & other supplementary code
* **`./obj`** -> Contains all scene's objects, either in self-enclosed Javascript classes/modules or in OBJ models
  * `./obj/Flame.js` -> The cube-based particle system that animates the flame and its light
  * `./obj/Bonfire.js` -> A class that loads and assigns materials to the bonfire elements (included in the **bonfire** sub-directory)
  * `./obj/Flower.js` -> A class that builds a simple voxel flower with a randomized color
  * `./obj/Grass.js` -> A class used to generate grass and seaweed
  * `./obj/Helpers.js` -> A module containing some functions, used in variuos classes and modules
  * `./obj/materials.js` -> A module containing the materials used in the Terrain generator
  * `./obj/Terrain.js` -> The class that builds the cube-based terrain. It uses a heightmap and some parameters to assing block
  materials based on height value and position.
  * `./obj/Tree.js` -> A Class that builds a tree
  * `./obj/vegetationData.js` -> Coordinates used to place flowers, grass and trees on the terrain.
* **`./photos`** -> Contains pictures used in this README
* <s>**`./textures`** -> Contains the heightmap and some textures that were used for testing purposes (from [Painterly Pack](http://painterlypack.net/))</s> Removed

<s>The project **does not** include a static version of the threejs library. All modules used are fetched from UNPKG's CDN system.</s>

## Performance and browser compatibility
<s>The scene displays correctly on Firefox (80), Safari (13.0.5), and Chrome (85), with the last one being the worst performing.
The framerate goes from 19 to 35 fps (depending on the zoom level) on a laptop with integrated graphics (Intel HD Graphics 630).
Memory usage is pretty low on all tested environments (~40-50Mb).

The most performance taxing element of the scene seems to be shadows.
To make the scene perform adequately on integrated graphics some tweaking was done to optimize shadow cameras position, resolution and frustum size; however, to avoid severe shadow acne and peter-panning effects, I had to set the shadowmap's size to 4k on the directional light simulating the sun/moon and to 2k on the flame's point light.

Other possible optimizations include rewriting the vegetation classes to use instanced meshes. Loading the terrain without vegetation, however, does not seem to offer a noticeable enough performance boost.</s>

### Updates to geometries and lighting
A more in-depth analysis has been carried out to determine the main causes of the performance problems I was having with this scene.

As a result, the scene's geometries and lighting setup have been updated.
- The shadow cameras's resolution and bias values have been tweaked to lower memory usage. This also makes it possible to load the scene on most smartphones.
- The directional light used to simulate direct sunlight has been replaced with a Spotlight with a very narrow angle and a precisely positioned shadow camera. This change boosts performance a little.
- The vegetation and terrain geometries now use instancing. This lowers memory usage dramatically and offer a very noticeable performance boost.

I've also made a tentative to integrate **Cascaded Shadow Maps** (see the _csm_ branch). The performance is marginally better and the shadows look much crisper, however I couldn't find a set of shadows parameters that work correctly for each camera position (the shadows completely disappear or get very faded at extreme distances and viewing angles).

**Results on chromium (r95):**
_memory usage:_ ~10Mb
_FPS:_ 50-60 (Intel HD Graphics 630)


## Tools used 
- **VS Code** and **Firefox Console**: for general Javascript development
- **Magica Voxel**: used to conceptualize and test dimension of some of the models. This was also used to generate the terrain
- **Photoshop**: textures set-up (used only for testing) and vegetation placing
- **MatLab**: some 'ad-hoc' script was written to generate a heightmap starting from 'sliced-PNGs' exported in Magica Voxel, however it was omitted from this release

