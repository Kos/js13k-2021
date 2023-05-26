# Beat Rocks

My submission for [JS13k 2021 compo](https://js13kgames.com/entries/2021).

### [Play the game](https://js13kgames.com/games/beat-rocks/index.html)

## Thanks

- Andrzej Mazur for relentlessly hosting the competition :)
- Fatfisz for encouraging me to take part in the compo \o/
- My fantastic playtesters: Sosz, Thomas Pendragon, Paweł Marczewski, Adam Jakubowski, Mateusz Krawczyk, Jan Ambroziewicz, Greg Solo
- Freya Holmér for publishing lots and lots of inspiration about rendering vector graphics

## Idea

I think this is my third or fourth attempt at making an Asteroids game. One attempt failed because I tried too hard at making an entity component system, another because I didn't come up with any asset pipeline. So I promised that I'll try the next one in 3D with wireframe rendering, so that I can have nice animations for rotating objects while keeping the retro "it's all lines" visuals.

The idea was in my mind for a long time but I wasn't eager to start, until Fatfisz told me that JS13k is starting and "SPACE" is the theme. I couldn't pass over it...

I wasn't originally planning to make this a rhythm game, the idea randomly came up later and it seemed to work. I was playing a lot of Tetris Effect earlier this year so I tried toying with the idea of sound effects "contributing" to the music.

Playtests revealed that it is confusing that when the player uses an ability, the effect triggers immediately but the sound only plays on the next beat (which can be half a second later). This led to the conclusion "why not _require_ the player to use skills on beat?". This way the game suddenly become a necrodancerlike :)

## Tech facts

### Sound

I composed the music on a Nintendo Switch, then moved it over to [SoundBox](https://sb.bitsnbites.eu/). I'm interested in synths but I have almost zero experience with composing, it's my longest song so far!

I also used SoundBox for sound effects. The sounds were done as other instruments in the same track, so that I could test how everything sounds together. Since SoundBox saves the song as JSON, I was able to extract and trim the sound tracks in the game code to separate audio buffers. 

### Graphics

I used [REGL](https://regl-project.github.io/regl/) for the graphics. REGL gives a convenient typed interface over raw WebGL that deals away with all the boilerplate.

Later I've rewritten the rendering in raw WebGL to save space. This was planned from the beginning (I knew REGL would be too big).

I've modelled some 3D objects in sketchup, saved to OBJ and converted to simplified JSON representation.

I've also used snippets from [@patriciogonzalezvivo's GIST](https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83) for the shader noise texture which made the backgrounds a little more interesting.

### Build & compression

Parcel was used for the build pipeline. I like Parcel because it has modules, Typescript and minification via Terser with zero setup. I never used Parcel on production, but I use it for all the toy projects and prototypes.

Terser doesn't touch shaders, so I minified them manually using [GLSLX](http://evanw.github.io/glslx/).
