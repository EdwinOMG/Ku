export const EXPLORE_PROMPTS: string[] = [
  // Nature
  'morning fog', 'fallen leaf', 'tide', 'lichen', 'drought', 'frost', 'moth',
  'fern', 'crow', 'oak', 'ember', 'moss', 'bloom', 'cedar', 'firefly',
  'heron', 'cobweb', 'dew', 'pollen', 'gust', 'hollow', 'thaw', 'birch',
  'glacier', 'monsoon', 'spider', 'sparrow', 'cobblestone', 'wildfire', 'pebble',
  'acorn', 'reed', 'blossom', 'thorn', 'sedge', 'cicada', 'murmur', 'catkin',
  'magpie', 'otter', 'flint', 'fen', 'canopy', 'burrow', 'spore', 'marrow',
  'silt', 'husk', 'dormant', 'estuary',

  // Emotions & inner states
  'grief', 'longing', 'wonder', 'stillness', 'surrender', 'awe', 'relief',
  'dread', 'tenderness', 'yearning', 'nostalgia', 'solitude', 'delight',
  'regret', 'calm', 'jealousy', 'reverence', 'unease', 'clarity', 'hope',
  'shame', 'belonging', 'exile', 'anticipation', 'weariness', 'joy',
  'melancholy', 'patience', 'fury', 'forgiveness', 'doubt', 'pride',

  // Sensory / texture
  'salt', 'smoke', 'silk', 'stone', 'ash', 'rust', 'velvet', 'chalk', 'ink',
  'copper', 'clay', 'glass', 'wool', 'amber', 'bone', 'linen', 'resin',
  'tar', 'beeswax', 'sawdust', 'iron', 'paper', 'candle', 'pine', 'leather',
  'flint', 'charcoal', 'gravel', 'cobalt', 'soot',

  // Time & moment
  'dusk', 'threshold', 'return', 'remnant', 'echo', 'solstice', 'equinox',
  'before dawn', 'last light', 'midnight', 'twilight', 'interval', 'aftermath',
  'pause', 'delay', 'lull', 'turning point', 'eve', 'first frost', 'end of season',
  'the in-between',

  // Place & space
  'riverbank', 'mountain pass', 'the clearing', 'harbor', 'attic', 'doorway',
  'crossing', 'rooftop', 'shoreline', 'field', 'cellar', 'alley', 'summit',
  'valley floor', 'the edge', 'far shore', 'open road', 'the dark wood',
  'tide pool', 'the ruins',

  // Abstract & philosophical
  'impermanence', 'witness', 'passage', 'unraveling', 'arrival', 'becoming',
  'dissolution', 'inheritance', 'absence', 'trace', 'silence', 'distance',
  'weight', 'light', 'memory', 'origin', 'cycle', 'loss', 'release', 'renewal',
]

export function getRandomPrompt(excluding: (string | null)[] = []): string {
  const pool = EXPLORE_PROMPTS.filter(p => !excluding.includes(p))
  return pool[Math.floor(Math.random() * pool.length)]
}
