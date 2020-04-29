# B2D Demo 1

## install / run

`yarn && TARGET=https://www.audiusa.com node ./index.js`

## test

`http://localhost:8080/models/audi-e-tron?script` vs `https://www.audiusa.com/models/audi-e-tron`

## observations

### StageGeneric component

- Prod: Media plays after application has re-hydrated
- B2D: Plays as soon as media buffer is primed

- Prod: Image height jank (due to above)
- B2D: No jank

- Prod: Scroll-next does not update history
- B2D: Scroll-next correctly updates history
