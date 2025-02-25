# three.js Screen Space Reflections

Implements performant Screen Space Reflections in three.js.
<br></br>
[<img src="https://raw.githubusercontent.com/0beqz/screen-space-reflections/screenshots/1.jpg">](https://screen-space-reflections.vercel.app)
<br></br>
<img src="https://raw.githubusercontent.com/0beqz/screen-space-reflections/screenshots//2.jpg">
<br></br>

## Demos

- [Basic](https://screen-space-reflections.vercel.app/)

- [Animated Background](https://screen-space-reflections.vercel.app/?dancer=true)

react-three-fiber demos:

- [Rover](https://codesandbox.io/s/ssr-rover-leixne?file=/src/Sophia-v1.js)

- [three.js journey scene](https://codesandbox.io/s/ssr-threejs-journey-84he6c)

## Usage

If you are using [react-three-fiber](https://github.com/pmndrs/react-three-fiber), you can also use the `SSR` component from [react-postprocessing](https://github.com/pmndrs/react-postprocessing). Check out the react-three-fiber demos to see how it's used there.
<br>

### Basic usage:

Install the package first:

```
npm i screen-space-reflections
```

Then add it to your code like so:

```javascript
import { SSREffect } from "screen-space-reflections"

const composer = new POSTPROCESSING.EffectComposer(renderer)

const ssrEffect = new SSREffect(scene, camera, options?)

const ssrPass = new POSTPROCESSING.EffectPass(camera, ssrEffect)

composer.addPass(ssrPass)
```

### Options

<details>
<summary>Default values of the optional "options" parameter</summary>

```javascript
const options = {
	temporalResolve: true,
	temporalResolveMix: 0.9,
	temporalResolveCorrection: 1,
	resolutionScale: 1,
	velocityResolutionScale: 1,
	width: typeof window !== "undefined" ? window.innerWidth : 1000,
	height: typeof window !== "undefined" ? window.innerHeight : 1000,
	blurMix: 0.5,
	blurSharpness: 10,
	blurKernelSize: 1,
	rayDistance: 10,
	intensity: 1,
	colorExponent: 1,
	maxRoughness: 1,
	jitter: 0,
	jitterSpread: 0,
	jitterRough: 0,
	roughnessFadeOut: 1,
	rayFadeOut: 0,
	MAX_STEPS: 20,
	NUM_BINARY_SEARCH_STEPS: 5,
	maxDepthDifference: 10,
	thickness: 10,
	ior: 1.45,
	CLAMP_RADIUS: 1,
	ALLOW_MISSED_RAYS: true,
	USE_MRT: true,
	USE_NORMALMAP: true,
	USE_ROUGHNESSMAP: true
}
```

</details>

<details>
  <summary>Description of the properties</summary>
  
| Name | Type |  | Description |
| --- | --- | --- | --- |
| temporalResolve | <code>boolean</code> |  | whether you want to use Temporal Resolving to re-use reflections from the last frames; this will reduce noise tremendously but may result in "smearing" || temporalResolveMix | <code>Number</code> |  | a value between 0 and 1 to set how much the last frame's reflections should be blended in; higher values will result in less noisy reflections when moving the camera but a more smeary look |
| resolutionScale | <code>Number</code> |  | resolution of the SSR effect, a resolution of 0.5 means the effect will be rendered at half resolution |
| velocityResolutionScale | <code>Number</code> |  | resolution of the velocity buffer, a resolution of 0.5 means velocity will be rendered at half resolution |
| width | <code>Number</code> |  | width of the SSREffect |
| height | <code>Number</code> |  | height of the SSREffect |
| blurMix | <code>Number</code> |  | how much the blurred reflections should be mixed with the raw reflections |
| blurSharpness | <code>Number</code> |  | exponent of the Box Blur filter; higher values will result in more sharpness |
| blurKernelSize | <code>Number</code> |  | kernel size of the Box Blur Filter; higher kernel sizes will result in blurrier reflections with more artifacts |
| rayDistance | <code>Number</code> |  | maximum distance a reflection ray can travel to find what it reflects |
| intensity | <code>Number</code> |  | intensity of the reflections |
| colorExponent | <code>Number</code> |  | exponent by which reflections will be potentiated when composing the current frame's reflections and the accumulated reflections into a final reflection; higher values will make reflections clearer by highlighting darker spots less |
| maxRoughness | <code>Number</code> |  | maximum roughness a texel can have to have reflections calculated for it |
| jitter | <code>Number</code> |  | how intense jittering should be |
| jitterSpread | <code>Number</code> |  | how much the jittered rays should be spread; higher values will give a rougher look regarding the reflections but are more expensive to compute with |
| jitterRough | <code>Number</code> |  | how intense jittering should be in relation to a material's roughness |
| roughnessFadeOut | <code>Number</code> |  | how intense reflections should be on rough spots; a higher value will make reflections fade out quicker on rough spots |
| rayFadeOut | <code>Number</code> |  | how much reflections will fade out by distance |
| MAX_STEPS | <code>Number</code> |  | number of steps a reflection ray can maximally do to find an object it intersected (and thus reflects) |
| NUM_BINARY_SEARCH_STEPS | <code>Number</code> |  | once we had our ray intersect something, we need to find the exact point in space it intersected and thus it reflects; this can be done through binary search with the given number of maximum steps |
| maxDepthDifference | <code>Number</code> |  | maximum depth difference between a ray and the particular depth at its screen position after refining with binary search; higher values will result in better performance |
| thickness | <code>Number</code> |  | maximum depth difference between a ray and the particular depth at its screen position before refining with binary search; higher values will result in better performance |     
| ior | <code>Number</code> |  | Index of Refraction, used for calculating fresnel; reflections tend to be more intense the steeper the angle between them and the viewer is, the ior parameter sets how much the intensity varies |
| CLAMP_RADIUS | <code>boolean</code> |  | how many surrounding pixels will be used for neighborhood clamping; a higher value can reduce noise when moving the camera but will result in less performance |
| ALLOW_MISSED_RAYS | <code>boolean</code> |  | if there should still be reflections for rays for which a reflecting point couldn't be found; enabling this will result in stretched looking reflections which can look good or bad depending on the angle |
| USE_MRT | <code>boolean</code> |  | WebGL2 only - whether to use multiple render targets when rendering the G-buffers (normals, depth and roughness); using them can improve performance as they will render all information to multiple buffers for each fragment in one run; this setting can't be changed during run-time |
| USE_NORMALMAP | <code>boolean</code> |  | if roughness maps should be taken account of when calculating reflections |
| USE_ROUGHNESSMAP | <code>boolean</code> |  | if normal maps should be taken account of when calculating reflections |

</details>

### ❗ Highly recommended: Use a GUI to tweak the options

Since the right options for an SSR effect depend a lot on the scene, it can happen that you don't seem to have an effect at all in your scene when you use the SSR effect for the first time in it without any configuration. This can have multiple causes such as `rayDistance` being way too low for your scene for example. So to find out which SSR options are right for your scene, you should use a GUI to find the right values easily.
The [example](https://github.com/0beqz/screen-space-reflections/tree/main/example) already comes with a simple one-file GUI [`SSRDebugGUI.js`](https://github.com/0beqz/screen-space-reflections/blob/main/example/SSRDebugGUI.js) that you can use in your project like so:

- First install the npm package of the module used for the GUI:

```
npm i tweakpane
```

- then just copy the `SSRDebugGUI.js` to your project and initialize it like so in your scene:

```javascript
import { SSRDebugGUI } from "./SSRDebugGUI"

const gui = new SSRDebugGUI(ssrEffect, options)
```

That's it, you should now have the GUI you can see in the [example scene](https://screen-space-reflections.vercel.app/). The `options` parameter is optional for the SSRDebugGUI and will default to the default options if no `options` parameter is given.

<br>

## Run Locally

If you'd like to test this project and run it locally, run these commands:

```
git clone https://github.com/0beqz/screen-space-reflections
cd screen-space-reflections/example
npm i --force
npm run dev
```

## Features

- Temporal Reprojection to re-use the last frame and thus reduce noise
- Jittering and blurring reflections to approximate rough reflections
- Using three.js' WebGLMultipleRenderTarget (WebGL2 only) to improve performance when rendering scene normals, depth and roughness
- Early out cases to compute only possible reflections and boost performance
- Box Blur to reduce noise

## What's new in v2

- Introduced Temporal Reprojection to reduce noise for the reflections when moving the camera by reprojecting the last frame's reflections into the current one
- Implemented accumulative sampling by saving and re-using the last frame's reflections to accumulate especially jittered reflections over frames
- Made all SSR-related options (e.g. `thickness`, `ior`, `rayDistance`,...) reactive so that you now just need to set `ssrEffect.rayDistance = value` for example to update values
- Fixed jittering so that it's actually correct from all angles (it used to be less intense the higher you were looking down at a reflection)
- Changed the SSR implementation from a pass to an effect to improve performance
- Optimizations regarding computation of required buffers and reflections

## Tips

<details>
  <summary>Expand to view tips</summary>
  
### Getting rid of artifacts

If you are getting artifacts, for example:

<br>
<img src="https://raw.githubusercontent.com/0beqz/screen-space-reflections/screenshots//artifacts.jpg" width="50%">

Then try the following:

- increase `thickness`
- increase `maxDepthDifference`
- decrease `rayDistance` and increase `MAX_STEPS` if reflections are cutting off now
- increase `NUM_BINARY_SEARCH_STEPS`

Keep in mind that increasing these values will have an impact on performance.
<br>

### Hiding missing reflections

Since SSR only works with screen-space information, there'll be artifacts when there's no scene information for a reflection ray.
This usually happens when another objects occludes a reflecting object behind it.
<br>
To make missing reflections less apparent, use an env-map that can then be used as a fallback when there is no reflection.
Ideally use a box-projected env-map.

Here are two implementations for three.js and react-three-fiber:

- [Gist to include box-projected env-maps in three.js](https://gist.github.com/0beqz/8d51b4ae16d68021a09fb504af708fca)
- [useBoxProjectedEnv in react-three-fiber](https://github.com/pmndrs/drei#useboxprojectedenv)
  <br>

### Getting updated reflections for animated materials

By default, the SSR effect won't really update reflections if the camera is not moving and no mesh in the view is moving.
However, it will check if a mesh's material's map is a `VideoTexture` and will keep its reflections updated each frame.
If your material is not using a `VideoTexture` but is still animated (e.g. it's a custom animated shader material), then you can get updated reflections for it by setting
`mesh.material.userData.needsUpdatedReflections = true`. This will make the SSR effect recalculate its reflections each frame.

### Server Side Rendering and `window` being undefined

If you are using Server Side Rendering and don't have access to the `window` object then the SSR effect won't be able to set the correct width and height for its passes.
So once you have access to the `window` object, set the correct width and height of the SSR effect using:

```javascript
ssrEffect.setSize(window.innerWidth, window.innerHeight)
```

  </details>
  <br>

## Todos

- [ ] Proper upsampling to still get quality reflections when using half-res buffers

## Credits

- SSR code: [Screen Space Reflections on Epsilon Engine](https://imanolfotia.com/blog/1)

- Edge fade for SSR: [kode80](http://kode80.com/blog/)

- Velocity Shader: [three.js sandbox](https://github.com/gkjohnson/threejs-sandbox)

- Box Blur filter: [glfx.js](https://github.com/evanw/glfx.js)

- Video texture: [Uzunov Rostislav](https://www.pexels.com/@rostislav/)

## Resources

### Screen Space Reflections in general

- [Rendering view dependent reflections using the graphics card](https://kola.opus.hbz-nrw.de/opus45-kola/frontdoor/deliver/index/docId/908/file/BA_GuidoSchmidt.pdf)

- [Screen Space Reflections in Unity 5](http://www.kode80.com/blog/2015/03/11/screen-space-reflections-in-unity-5/)

- [Screen Space Glossy Reflections](http://roar11.com/2015/07/screen-space-glossy-reflections/)

- [Screen Space Reflection (SSR)](https://lettier.github.io/3d-game-shaders-for-beginners/screen-space-reflection.html)

- [Approximating ray traced reflections using screenspace data](https://publications.lib.chalmers.se/records/fulltext/193772/193772.pdf)

- [Screen Space Reflection Techniques](https://ourspace.uregina.ca/bitstream/handle/10294/9245/Beug_Anthony_MSC_CS_Spring2020.pdf)

- [Shiny Pixels and Beyond: Real-Time Raytracing at SEED](https://media.contentapi.ea.com/content/dam/ea/seed/presentations/dd18-seed-raytracing-in-hybrid-real-time-rendering.pdf)

- [DD2018: Tomasz Stachowiak - Stochastic all the things: raytracing in hybrid real-time rendering (YouTube)](https://www.youtube.com/watch?v=MyTOGHqyquU)

### Temporal Reprojection

- [Temporal Reprojection Anti-Aliasing in INSIDE](http://s3.amazonaws.com/arena-attachments/655504/c5c71c5507f0f8bf344252958254fb7d.pdf?1468341463)

- [Reprojecting Reflections](http://bitsquid.blogspot.com/2017/06/reprojecting-reflections_22.html)

- [Temporal AA (Unreal Engine 4)](https://de45xmedrsdbp.cloudfront.net/Resources/files/TemporalAA_small-59732822.pdf)

- [Temporally Reliable Motion Vectors for Real-time Ray Tracing](https://sites.cs.ucsb.edu/~lingqi/publications/paper_trmv.pdf)

- [Temporal AA and the quest for the Holy Trail](https://www.elopezr.com/temporal-aa-and-the-quest-for-the-holy-trail/)

- [Visibility TAA and Upsampling with Subsample History](http://filmicworlds.com/blog/visibility-taa-and-upsampling-with-subsample-history/)

- [Temporal Anti Aliasing – Step by Step](https://ziyadbarakat.wordpress.com/2020/07/28/temporal-anti-aliasing-step-by-step/)

- [Filmic SMAA: Sharp Morphological and Temporal Antialiasing](https://research.activision.com/publications/archives/filmic-smaasharp-morphological-and-temporal-antialiasing)
