// seaFishingScore.js
document.addEventListener('DOMContentLoaded', () => {
  // -- Storage Helpers
  const STORAGE_KEY = 'fishingAnglers';
  function loadProfiles() {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return raw.map(p => ({
      ...p,
      xp:                typeof p.xp === 'number' ? p.xp : 0,
      level:             typeof p.level === 'number' ? p.level : 1,
      badges:            Array.isArray(p.badges) ? p.badges : [],
      legendaryLog:      Array.isArray(p.legendaryLog) ? p.legendaryLog : [],
      history:           Array.isArray(p.history) ? p.history : [],
      totalFishingTime:  typeof p.totalFishingTime === 'number' ? p.totalFishingTime : 0
    }));
  }
  function saveProfiles(profiles) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }

  // -- App State
  let profiles             = loadProfiles();
  let selectedProfiles     = [];
  let editingId            = null;
  let selectedMode         = null;
  let sessionStart         = null;
  let sessionTimerInterval = null;

  let currentAngler = null;
  let currentFish   = null;
  let currentLength = null;
  let logEntries    = [];

  const AVATARS = [
    'anglerOne.png','anglerTwo.png','anglerThree.png','anglerFour.png',
    'anglerFive.png','anglerSix.png','anglerSeven.png','anglerEight.png'
  ];

    // -- Fish species data: weightPerCm (w), score multiplier (m)
  const fishData = {
    "Blue shark":               { w:0.59,  m:12   },
    "Porbeagle shark":          { w:1.10,  m:15   },
    "Thresher shark":           { w:1.00,  m:20   },
    "Tope":                     { w:0.31,  m:10   },
    "Smoothhound":              { w:0.15,  m:6    },
    "Spurdog":                  { w:0.15,  m:8    },
    "Bull huss":                { w:0.16,  m:5    },
    "Lesser spotted dogfish":   { w:0.043, m:2    },
    "Thornback ray":            { w:0.25,  m:5    },
    "Blonde ray":               { w:0.37,  m:6    },
    "Small-eyed ray":           { w:0.23,  m:7    },
    "Spotted ray":              { w:0.13,  m:4    },
    "Undulate ray":             { w:0.30,  m:9    },
    "Cuckoo ray":               { w:0.10,  m:11   },
    "Plaice":                   { w:0.049, m:4    },
    "Dab":                      { w:0.033, m:2    },
    "Flounder":                 { w:0.056, m:3    },
    "Sole (common/Dover)":      { w:0.056, m:6    },
    "Turbot":                   { w:0.21,  m:9    },
    "Brill":                    { w:0.17,  m:8    },
    "Conger eel":               { w:0.27,  m:7    },
    "Silver eel":               { w:0.035, m:10   },
    "Cod":                      { w:0.125, m:6    },
    "Pollack":                  { w:0.11,  m:4    },
    "Coalfish":                 { w:0.083, m:3    },
    "Bass":                     { w:0.10,  m:8    },
    "Mackerel":                 { w:0.023, m:1    },
    "Scad (horse mackerel)":    { w:0.017, m:1.5  },
    "Garfish":                  { w:0.025, m:5    },
    "Whiting":                  { w:0.030, m:2    },
    "Pouting":                  { w:0.029, m:1.5  },
    "Poor cod":                 { w:0.020, m:1.2  },
    "Launce (greater sand eel)":{ w:0.007, m:1.3  },
    "Red gurnard":              { w:0.056, m:3    },
    "Grey gurnard":             { w:0.043, m:2.5  },
    "Tub gurnard":              { w:0.083, m:4    },
    "John Dory":                { w:0.080, m:12   },
    "Ballan wrasse":            { w:0.080, m:3    },
    "Cuckoo wrasse":            { w:0.029, m:4    },
    "Ling":                     { w:0.27,  m:9    },
    "Haddock":                  { w:0.083, m:3.5  },
    "Black bream":              { w:0.075, m:5    },
    "Gilthead bream":           { w:0.10,  m:8    }
  };

  // -- Renown tiers for each species

const RENOWN = {
  // Sharks
  "Blue shark": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm: 100, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm: 150, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm: 200, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm: 230, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 260, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Porbeagle shark": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  80, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm: 120, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm: 160, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm: 200, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 230, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Thresher shark": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm: 120, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm: 170, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm: 210, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm: 250, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 280, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Tope": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  80, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm: 110, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm: 130, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm: 150, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 170, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Smoothhound": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  60, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  80, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  95, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm: 110, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 125, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Spurdog": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  50, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  70, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  85, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm: 100, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 115, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Bull huss": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  60, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  80, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  95, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm: 110, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 125, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Lesser spotted dogfish": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  45, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  55, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  65, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  75, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  85, bonusXP: 50, bonusMult: 1.5 }
  ],

  // Rays & Skates
  "Thornback ray": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  45, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  60, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  70, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  80, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  90, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Blonde ray": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  50, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  65, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  80, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  95, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 110, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Small-eyed ray": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  40, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  55, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  65, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  75, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  85, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Spotted ray": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  35, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  45, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  55, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  65, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  75, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Undulate ray": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  45, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  60, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  75, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  90, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 105, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Cuckoo ray": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  35, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  45, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  55, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  65, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  75, bonusXP: 50, bonusMult: 1.5 }
  ],

  // Flatfish
  "Plaice": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  30, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  40, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  50, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  60, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  65, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Dab": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  20, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  25, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  30, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  35, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  40, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Flounder": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  30, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  40, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  50, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  55, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  60, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Sole (common/Dover)": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  28, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  35, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  40, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  45, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  50, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Turbot": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  35, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  50, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  60, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  70, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  80, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Brill": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  35, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  45, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  55, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  65, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  75, bonusXP: 50, bonusMult: 1.5 }
  ],

  // Eels
  "Conger eel": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  80, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm: 120, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm: 150, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm: 180, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 200, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Silver eel": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  40, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  60, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  70, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  80, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  90, bonusXP: 50, bonusMult: 1.5 }
  ],

  // Other Roundfish
  "Cod": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  40, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  55, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  65, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  75, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  85, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Pollack": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  40, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  55, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  65, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  75, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  85, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Coalfish": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  35, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  50, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  60, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  70, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  80, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Bass": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  36, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  50, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  60, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  70, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  80, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Mackerel": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  25, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  30, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  35, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  40, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  45, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Scad (horse mackerel)": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  20, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  25, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  30, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  35, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  40, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Garfish": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  40, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  55, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  65, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  75, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  85, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Whiting": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  25, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  35, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  40, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  45, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  50, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Pouting": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  20, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  30, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  35, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  40, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  45, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Poor cod": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  15, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  20, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  25, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  30, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  35, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Launce (greater sand eel)": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  20, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  25, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  30, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  35, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  40, bonusXP: 50, bonusMult: 1.5 }
  ],

  // Gurnards & Oddities
  "Red gurnard": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  25, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  35, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  40, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  45, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  50, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Grey gurnard": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  20, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  25, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  30, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  35, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  40, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Tub gurnard": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  30, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  40, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  45, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  50, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  55, bonusXP: 50, bonusMult: 1.5 }
  ],
  "John Dory": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  25, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  35, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  40, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  45, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  50, bonusXP: 50, bonusMult: 1.5 }
  ],

  // Wrasse & Reef Fish
  "Ballan wrasse": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  30, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  40, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  45, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  50, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  55, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Cuckoo wrasse": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  20, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  25, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  30, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  35, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  40, bonusXP: 50, bonusMult: 1.5 }
  ],

  // Other Bream & Relatives
  "Ling": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  60, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  90, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm: 110, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm: 130, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm: 150, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Haddock": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  35, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  45, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  50, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  55, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  60, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Black bream": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  25, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  30, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  35, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  40, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  45, bonusXP: 50, bonusMult: 1.5 }
  ],
  "Gilthead bream": [
    { name: "Juvenile",  minCm:   0, bonusXP:  0, bonusMult: 0   },
    { name: "Bronze",    minCm:  25, bonusXP:  5, bonusMult: 0   },
    { name: "Silver",    minCm:  35, bonusXP: 10, bonusMult: 0   },
    { name: "Gold",      minCm:  40, bonusXP: 15, bonusMult: 0   },
    { name: "Diamond",   minCm:  45, bonusXP: 25, bonusMult: 0   },
    { name: "Legendary", minCm:  50, bonusXP: 50, bonusMult: 1.5 }
  ]
};


  // -- Legendary name pools
 
const LEGENDARY_NAMES = {
  // Sharks
  "Blue shark": [
    "Cobalt Kraken-Kisser",
    "Sapphire Slashfin",
    "Azure Ripjaw",
    "Midnight Bluesbane",
    "Turquoise Titan"
  ],
  "Porbeagle shark": [
    "Barking Beagleback",
    "Porbeagle of Perdition",
    "Beaglejaw Battalion",
    "Hound of the Deep",
    "Barkaleviathan"
  ],
  "Thresher shark": [
    "The Threshinator",
    "Whale-Tail Wraith",
    "Scythefin Titan",
    "Thresher’s Requiem",
    "Tailwhip Terror"
  ],
  "Tope": [
    "Topes of Wrath",
    "Abyssal Apex Tope",
    "Tope Terrorizer",
    "Sea-Tope Behemoth",
    "Tip-Top Tornado"
  ],
  "Smoothhound": [
    "Velvet-Jaw Sovereign",
    "Silken Hound of the Deep",
    "Smoothhound Scourge",
    "Lupine Leviathan",
    "Slippery Sovereign"
  ],
  "Spurdog": [
    "Thornspine Tyrant",
    "Spurred Fang Fiend",
    "Spurdog Sovereign",
    "Spikejaw Behemoth",
    "Spinegrip Leviathan"
  ],
  "Bull huss": [
    "Bullhorn Behemoth",
    "Husshammer Herald",
    "Raging Bull Huss",
    "Abyssal Bull Rager",
    "Horned Fury of the Deep"
  ],
  "Lesser spotted dogfish": [
    "Spotsbane Pup",
    "Microspotted Mauler",
    "Dotjaw Desolator",
    "Pup of a Thousand Spots",
    "Dappled Doom"
  ],

  // Rays & Skates
  "Thornback ray": [
    "Thornback Titan",
    "Spikescale Sovereign",
    "Bristleback Brutus",
    "Prickledus Rex",
    "Thornbringer Leviathan"
  ],
  "Blonde ray": [
    "Goldilocks Glider",
    "Blondelord of the Deep",
    "Flaxen Flapper",
    "Sunlit Sovereign",
    "Honeyfin Horror"
  ],
  "Small-eyed ray": [
    "Squintwing Scourge",
    "Pinpoint Prowler",
    "Microsight Marauder",
    "The Squinter Sovereign",
    "Beady-Gaze Behemoth"
  ],
  "Spotted ray": [
    "Polka-Dot Destroyer",
    "Spotstrike Sovereign",
    "Punctal Powerhouse",
    "Polkadot Phantom",
    "Dottedus Rex"
  ],
  "Undulate ray": [
    "Wavelord of the Depths",
    "Rippleback Ravager",
    "Undulatus Titan",
    "Cresting Chaos",
    "Sinuous Scourge"
  ],
  "Cuckoo ray": [
    "Cuckoofin Czar",
    "Lunefin Lunatic",
    "Cuckoorageous Leviathan",
    "Birdfin Behemoth",
    "Devouring Cuckoo"
  ],

  // Flatfish
  "Plaice": [
    "Placidus Rex",
    "Plaicequake Terror",
    "Flatland Fury",
    "Plaice of Peril",
    "Bedrock Beast"
  ],
  "Dab": [
    "Dabolisher of Seas",
    "Dabsolutive Destroyer",
    "The Dabdominator",
    "Abyssal Dabraith",
    "Flat-Strike Fiend"
  ],
  "Flounder": [
    "Flounderwraith",
    "Abyssal Floundraptor",
    "Floudershred Titan",
    "Flounder Fury",
    "Flatfin Phenom"
  ],
  "Sole (common/Dover)": [
    "Solstice Sovereign",
    "Dover Dominator",
    "Solemnus Rex",
    "Sandstride Scourge",
    "Single-Foot Behemoth"
  ],
  "Turbot": [
    "Turbo-Tsunami Turbot",
    "Turbotron Titan",
    "Spottledus Maximus",
    "Abyssal Discus",
    "Turbotoren Ravager"
  ],
  "Brill": [
    "Brilliance Bringer",
    "Brillarific Beast",
    "Abyssal Beacon",
    "Brill’s Wrath",
    "Flatlight Fury"
  ],

  // Eels
  "Conger eel": [
    "Conge-Ravager",
    "Abyssal Congeratron",
    "Coilpede Conqueror",
    "Jawconger Juggernaut",
    "Serpentail Sovereign"
  ],
  "Silver eel": [
    "Argentum Serpent",
    "Silverstrike Sovereign",
    "Sterling Serpent",
    "Gleamjaw Guardian",
    "Moonlit Mamba"
  ],

  // Other Roundfish
  "Cod": [
    "Codzilla",
    "Codfather of Chaos",
    "Abyssal Coddom",
    "Codgaze Colossus",
    "Bountiful Behemoth"
  ],
  "Pollack": [
    "Pollackpocalypse",
    "The Pollack Paladin",
    "Abyssal Pollscraper",
    "Pollackulous Predator",
    "Puncturepoll Conqueror"
  ],
  "Coalfish": [
    "Coalcrusher Titan",
    "Sulfurous Sovereign",
    "Carbocoalus Beast",
    "Emberjaw Leviathan",
    "Blackscale Behemoth"
  ],
  "Bass": [
    "Bassquake Behemoth",
    "Sonic-Boom Bass",
    "Bassdrop Dominator",
    "Lowdown Leviathan",
    "Thunder-Tone Titan"
  ],
  "Mackerel": [
    "Mackerel Maelstrom",
    "Mackersaurus Rex",
    "Flickerfin Fury",
    "Silver-Bullet Beast",
    "Mach-Fin Maverick"
  ],
  "Scad (horse mackerel)": [
    "Hoofin’ Horror",
    "Scadnado Sovereign",
    "Abyssal Stallionfin",
    "Horsepower Ravager",
    "Scaddling Scourge"
  ],
  "Garfish": [
    "Garfury Striker",
    "Spikebeak Sovereign",
    "Garfish Gargantua",
    "Beakblade Beast",
    "Lancer Leviathan"
  ],
  "Whiting": [
    "Whiteout Wraith",
    "Whitelash Terror",
    "Whiting Warlord",
    "Bleachblade Behemoth",
    "Frostfin Fury"
  ],
  "Pouting": [
    "Poutpocalypse",
    "Abyssal Sulker",
    "Poutjaw Juggernaut",
    "Sullen Sovereign",
    "Grumblefin Giant"
  ],
  "Poor cod": [
    "Pitycod Punisher",
    "Patron Saint of Poor Cod",
    "Benevolent Behemoth",
    "Misanthropic Morsel",
    "Underdog of the Deep"
  ],
  "Launce (greater sand eel)": [
    "Lance of the Sandy Depths",
    "Sandlance Scourge",
    "Spearfin Sovereign",
    "Substratum Stabber",
    "Launcetastic Leviathan"
  ],

  // Gurnards & Oddities
  "Red gurnard": [
    "Crimson Crawler",
    "Gurnador of the Deep",
    "Ruby Rumbler",
    "Scarlet Striker",
    "Firefin Fury"
  ],
  "Grey gurnard": [
    "Ashen Ambusher",
    "Greyhound of the Depths",
    "Smokestack Sovereign",
    "Shadowfin Stalker",
    "Fogwing Fiend"
  ],
  "Tub gurnard": [
    "Tubbered Titan",
    "Gurnardian Guardian",
    "Tubstrike Terror",
    "Bulkfin Behemoth",
    "Barrelback Brute"
  ],
  "John Dory": [
    "Doryus Dominator",
    "Lucky Stinger",
    "Zeus-Dory Rex",
    "Singular Scourge",
    "Marblefin Monarch"
  ],

  // Wrasse & Reef Fish
  "Ballan wrasse": [
    "Ballan Basher",
    "Wrassewarrior of the Deep",
    "Boulderjaw Behemoth",
    "Stonecrush Sovereign",
    "Reefbulwark Titan"
  ],
  "Cuckoo wrasse": [
    "Cuckoo Crusader",
    "Wrassewraith",
    "Lunefin Lancer",
    "Eccentrifin Emperor",
    "Cuckooclamor Colossus"
  ],

  // Other Bream & Relatives
  "Ling": [
    "Linglord Leviathan",
    "Sea-Ling Sovereign",
    "Dreadling Destroyer",
    "Lingblade Rumbler",
    "Enduring Eelcod"
  ],
  "Haddock": [
    "Haddockhammer",
    "The Haddominator",
    "Abyssal Flamefin",
    "Pisci-haddock Punisher",
    "Saltshard Sovereign"
  ],
  "Black bream": [
    "Onyx Breambringer",
    "Blackout Behemoth",
    "Shadowbream Scourge",
    "Obsidianjaw Leviathan",
    "Darkfin Dominator"
  ],
  "Gilthead bream": [
    "Gilded Crownfin",
    "Aureate Avenger",
    "Helmbream Herald",
    "Suncrest Sovereign",
    "Goldenhead Guardian"
  ]
};


    // -- Show / Hide helpers
  function show(el) { if(el) el.classList.remove('hidden'); }
  function hide(el) { if(el) el.classList.add('hidden'); }

  // -- Format seconds → "HH:MM:SS"
  function formatTime(sec) {
    const h = String(Math.floor(sec/3600)).padStart(2,'0');
    const m = String(Math.floor((sec%3600)/60)).padStart(2,'0');
    const s = String(sec%60).padStart(2,'0');
    return `${h}:${m}:${s}`;
  }

  // -- Live session timer update
  function updateSessionTime() {
    if (!sessionStart) return;
    const elapsed = Math.round((Date.now() - sessionStart)/1000);
    const el = document.getElementById('session-time');
    if(el) el.textContent = formatTime(elapsed);
  }

  // -- Determine renown tier by lookup
function getRenownTier(species, length) {
  const tiers = RENOWN[species] || [];
  // Look through the reversed tier array and pick the first whose minCm ≤ length
  return tiers
    .slice().reverse()
    .find(t => length >= t.minCm)   // <-- use minCm here
  || tiers[0];
  }

  // -- Pick a legendary name for this species
  function pickLegendaryName(species) {
    const pool = LEGENDARY_NAMES[species] || [];
    return pool[Math.floor(Math.random()*pool.length)];
  }

  // -- XP needed for next level
  function xpForLevel(lv) {
    let xp = 0;
    for(let i=2;i<=lv;i++) xp += 50*i;
    return xp;
  }

  // -- Level up if XP threshold crossed
  function maybeLevelUp(p) {
    while (p.xp >= xpForLevel(p.level+1)) {
      p.level++;
      alert(`🔥 Level Up! ${p.name} reached lvl ${p.level}`);
    }
  }

    // Choose anglers
  const profileSection     = document.getElementById('profile-section');
  const profileGrid        = document.getElementById('profile-grid');
  const profileContinueBtn = document.getElementById('profile-continue-btn');
  let viewSessionInitBtn = document.getElementById('view-session-init');
  let viewAllInitBtn     = document.getElementById('view-alltime-init');

  // Profile modal
  const modal            = document.getElementById('profile-modal');
  const modalTitle       = document.getElementById('modal-title');
  const inputName        = document.getElementById('profile-name');
  const inputAge         = document.getElementById('profile-age');
  const avatarOptions    = document.getElementById('avatar-options');
  const saveProfileBtn   = document.getElementById('save-profile-btn');
  const cancelProfileBtn = document.getElementById('cancel-profile-btn');

  // Mode selection
  const modeSection     = document.getElementById('mode-section');
  const modeButtons     = document.querySelectorAll('.mode-btn[data-mode]');
  const modeDescription = document.getElementById('mode-description');
  const modeDescText    = document.getElementById('mode-desc-text');
  const startGameBtn    = document.getElementById('start-game-btn');

  // Game screen
  const gameSection      = document.getElementById('game-section');
  const caughtOneBtn     = document.getElementById('caught-one-btn');
  const scoreList        = document.getElementById('score-list');
  const logList          = document.getElementById('log-list');
  const undoBtn          = document.getElementById('undo-btn');
  const endSessionBtn    = document.getElementById('end-session-btn');

  // Session & All-Time panels
  const toggleSessionBtn  = document.getElementById('toggle-session-profile');
  const sessionPanel      = document.getElementById('session-profile');
  const viewAllBtn        = document.getElementById('view-alltime-profile');
  const alltimeModal      = document.getElementById('alltime-modal');
  const closeAlltimeModal = document.getElementById('close-alltime-modal');

  // Catch flow
  const catchFlowSection  = document.getElementById('catch-flow-section');
  const anglerButtons     = document.getElementById('angler-buttons');
  const fishButtons       = document.getElementById('fish-buttons');
  const confirmFishBtn    = document.getElementById('confirm-fish-btn');
  const lengthInput       = document.getElementById('length-input');
  const lengthContinueBtn = document.getElementById('length-continue-btn');
  const catchSummary      = document.getElementById('catch-summary');
  const confirmCatchBtn   = document.getElementById('confirm-catch-btn');
  const cancelCatchBtn    = document.getElementById('cancel-catch-btn');

  // Select angler modal
  const selectAnglerModal   = document.getElementById('select-angler-modal');
  const selectAnglerButtons = document.getElementById('select-angler-buttons');
  const cancelSelectAngler  = document.getElementById('cancel-select-angler');

    // Render avatar options
  function renderAvatars() {
    avatarOptions.innerHTML = '';
    AVATARS.forEach(file => {
      const img = document.createElement('img');
      img.src        = `media/pictures/${file}`;
      img.dataset.src= file;
      img.className  = 'avatar-option';
      img.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option')
                .forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
      });
      avatarOptions.appendChild(img);
    });
  }

  // Render profile cards grid
  function renderProfiles() {
    profileGrid.innerHTML = '';
    profiles.forEach(p => {
      const card = document.createElement('div');
      card.className = 'profile-card';
      if (selectedProfiles.includes(p.id)) card.classList.add('selected');
      card.dataset.id = p.id;
      card.innerHTML = `
        <img src="media/pictures/${p.avatarPic}" alt="${p.name}"/>
        <div class="name">${p.name}</div>
        <div class="level">Lvl ${p.level} (${p.xp} XP)</div>
        <div class="edit-icon">✎</div>
      `;
      card.addEventListener('click', e => {
        if (e.target.classList.contains('edit-icon')) openModal(p.id);
        else toggleProfileSelection(p.id);
      });
      profileGrid.appendChild(card);
    });
    if (profiles.length < 6) {
      const add = document.createElement('div');
      add.className = 'add-card';
      add.textContent = '+';
      add.addEventListener('click', () => openModal(null));
      profileGrid.appendChild(add);
    }
    profileContinueBtn.disabled = selectedProfiles.length < 2;
  }

  function toggleProfileSelection(id) {
    const idx = selectedProfiles.indexOf(id);
    if (idx === -1 && selectedProfiles.length < 6) {
      selectedProfiles.push(id);
    } else if (idx > -1) {
      selectedProfiles.splice(idx, 1);
    }
    renderProfiles();
  }

    // Open / close add-edit modal
  function openModal(id) {
    editingId = id;
    modalTitle.textContent = id ? 'Edit Profile' : 'Add Profile';
    if (id) {
      const p = profiles.find(x => x.id === id);
      inputName.value = p.name; inputAge.value = p.age;
    } else {
      inputName.value = ''; inputAge.value = '';
    }
    renderAvatars();
    show(modal);
  }
  function closeModal() {
    hide(modal);
    editingId = null;
  }

  // Save profile
  saveProfileBtn.addEventListener('click', () => {
    const name = inputName.value.trim();
    const age  = parseInt(inputAge.value,10);
    const sel  = document.querySelector('.avatar-option.selected');
    if (!name||!age||!sel) return alert('Name, Age & Avatar required.');
    const avatarPic = sel.dataset.src;
    if (editingId) {
      profiles = profiles.map(p =>
        p.id===editingId?{...p,name,age,avatarPic}:p
      );
    } else {
      profiles.push({
        id: crypto.randomUUID(), name,age,avatarPic,
        xp:0, level:1,
        badges:[], legendaryLog:[], history:[],
        totalFishingTime:0
      });
    }
    saveProfiles(profiles);
    renderProfiles();
    closeModal();
  });
  cancelProfileBtn.addEventListener('click', closeModal);

  // Init choose-anglers screen
  renderProfiles();
  viewSessionInitBtn = document.getElementById('view-session-init');
   viewAllInitBtn     = document.getElementById('view-alltime-init');

  viewSessionInitBtn.addEventListener('click', () => openSelectAngler('session'));
  viewAllInitBtn    .addEventListener('click', () => openSelectAngler('alltime'));

  // Mode buttons
  const MODE_DESC = {
    'Biggest Fish':'Only your single heaviest fish counts.',
    'Heaviest Haul':'Sum of all weights.',
    'Most Fish':'Each catch = 1 point.',
    'Sharks Only':'Only sharks score.'
  };
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMode = btn.dataset.mode;
      modeDescText.textContent = MODE_DESC[selectedMode];
      show(modeDescription);
      startGameBtn.disabled = false;
    });
  });
  profileContinueBtn.addEventListener('click', () => {
    profiles = profiles.filter(p => selectedProfiles.includes(p.id));
    saveProfiles(profiles);
    hide(profileSection);
    show(modeSection);
  });
  startGameBtn.addEventListener('click', () => {
    hide(modeSection);
    initGame();
  });

    function initGame() {
    // Start session timer
    sessionStart = Date.now();
    updateSessionTime();
    sessionTimerInterval = setInterval(updateSessionTime,1000);

    // Reveal profile buttons mid-game
    show(viewSessionInitBtn);
    show(viewAllInitBtn);

    // Reset session state
    profiles.forEach(p => p.sessionScore=0);
    logEntries = [];

    show(gameSection);
    renderScoreboard();
    renderLog();
    updateUndo();

    // Wire catch flow & session end
    caughtOneBtn.addEventListener('click',startCatchFlow);
    undoBtn.addEventListener('click',undoCatch);
    endSessionBtn.addEventListener('click',endSession);

    toggleSessionBtn.addEventListener('click',()=>openSelectAngler('session'));
    viewAllBtn.addEventListener('click',   ()=>openSelectAngler('alltime'));
    closeAlltimeModal.addEventListener('click',()=>hide(alltimeModal));
    cancelSelectAngler .addEventListener('click',()=>hide(selectAnglerModal));
  }

    function renderScoreboard() {
    scoreList.innerHTML='';
    profiles.forEach(p=>{
      const li=document.createElement('li');
      li.textContent=`${p.name} (Lvl ${p.level}): ${p.sessionScore} pts`;
      scoreList.appendChild(li);
    });
  }

 function renderLog() {
  const logList = document.getElementById('log-list');
  logList.innerHTML = '';

  logEntries.forEach(e => {
    // 1) Build the entry div
    const entryDiv = document.createElement('div');
    entryDiv.classList.add('log-entry');
    entryDiv.innerHTML = `
      <strong>${e.timestamp}</strong> –
      ${e.angler} caught <em>${e.fish}</em>
      (${e.length}cm, ${e.weight}lbs)
      → ${e.score} pts
    `;

    // 2) Append “View on map” link if coords exist
    if (e.lat && e.lng) {
      const a = document.createElement('a');
      a.href        = `https://www.google.com/maps?q=${e.lat},${e.lng}`;
      a.target      = '_blank';
      a.textContent = 'View on map';
      a.classList.add('view-map-link');
      entryDiv.appendChild(a);
    }

    // 3) Add to the log container
    logList.appendChild(entryDiv);
  });

  // 4) Update undo button state
  updateUndo();
}

  function updateUndo() {
    undoBtn.disabled = logEntries.length===0;
  }

  function undoCatch() {
    if (!logEntries.length || !confirm('Undo last catch?')) return;
    const rem = logEntries.shift();
    const prof = profiles.find(p=>p.name===rem.angler);
    prof.sessionScore = Math.max(0,prof.sessionScore-rem.score);
    renderLog(); renderScoreboard(); updateUndo();
  }

  function endSession() {
    if (!confirm('End session?')) return;
    clearInterval(sessionTimerInterval);

    const nowMs = Date.now();
    const duration = Math.round((nowMs-sessionStart)/1000);
    const stamp    = new Date().toLocaleString();

    profiles.forEach(p=>{
      if (!Array.isArray(p.history)) p.history=[];

      const catches = logEntries
        .filter(e=>e.angler===p.name)
        .map(e=>({
          fish: e.fish, length: e.length,
          weight: e.weight, tier: e.tier,
          legendaryName: e.legendaryName
        }));

      p.history.push({
        date:stamp, score:p.sessionScore,
        catches, duration
      });
      p.totalFishingTime = (p.totalFishingTime||0)+duration;
      delete p.sessionScore;
    });

     saveProfiles(profiles);

  // ⬅️ INSERT: export all profiles to PDF, then reload
  exportAllProfilesToPDF();
setTimeout(() => location.reload(), 500);
} // <-- Add this closing brace to properly close endSession()

// Prompt angler→fish→length→confirm
function startCatchFlow() {
  hide(gameSection); show(catchFlowSection);
  hide(document.getElementById('session-profile'));
  // likewise hide the all-time modal
  hide(document.getElementById('alltime-modal'));

  showStep('step-angler');
  renderAnglerButtons(); renderFishButtons();
}

function showStep(id) {
  document.querySelectorAll('.catch-step').forEach(s=>hide(s));
  document.getElementById(id).classList.remove('hidden');
}

function renderAnglerButtons() {
  anglerButtons.innerHTML='';
  profiles.forEach(p=>{
    const btn=document.createElement('button');
    btn.className='angler-btn';
    btn.textContent=p.name;
    btn.addEventListener('click',()=>{
      currentAngler=p; showStep('step-fish');
    });
    anglerButtons.appendChild(btn);
  });
}

function renderFishButtons() {
  fishButtons.innerHTML='';
  Object.keys(fishData).sort().forEach(sp=>{
    const btn=document.createElement('button');
    btn.className='fish-btn';
    btn.textContent=sp;
    btn.addEventListener('click',()=>{
      currentFish=sp;
      document.querySelectorAll('.fish-btn').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      show(confirmFishBtn);
    });
    fishButtons.appendChild(btn);
  });
}

confirmFishBtn.addEventListener('click',()=>showStep('step-length'));

lengthContinueBtn.addEventListener('click',()=>{
  currentLength = parseFloat(lengthInput.value);
  if (isNaN(currentLength)||currentLength<=0) {
    return alert('Enter valid length.');
  }
  const spec = fishData[currentFish];
  if (!spec) {
    console.error('No fishData entry for:', currentFish);
    alert(`Error: unknown species "${currentFish}"`);
    return;
  }
  // → CHECK ENDS HERE

  // Calculate weight
  const weight = +(currentLength * spec.w).toFixed(2);

  // Calculate raw points (pts per lb)
  const rawPts = weight * spec.m;

  // Determine renown tier & XP/bonus
  const tierObj = getRenownTier(currentFish, currentLength);
  const xpGain  = Math.round(rawPts * 10) + tierObj.bonusXP;
  const bonusM  = tierObj.bonusMult;

  // Legendary name logic
  let legendaryName = null;
  if (tierObj.name === 'Legendary') {
    legendaryName = pickLegendaryName(currentFish);
    alert(`🎺 Legendary Catch: ${legendaryName}!`);
    currentAngler.badges.push(`legendary-${currentFish}`);
    currentAngler.legendaryLog.push({
      fish: currentFish,
      length: currentLength,
      name: legendaryName,
      time: new Date().toLocaleString()
    });
  }

  // Final score = rawPts + bonusMult
  const finalScore = Math.round(rawPts + bonusM);

  // Populate confirmation summary
  catchSummary.innerHTML = `
    <p><strong>Angler:</strong> ${currentAngler.name}</p>
    <p><strong>Fish:</strong> ${currentFish} (${tierObj.name})</p>
    <p><strong>Length:</strong> ${currentLength} cm</p>
    <p><strong>Weight:</strong> ${weight} lbs</p>
    <p><strong>Score:</strong> ${finalScore} pts</p>
    <p><strong>XP Earned:</strong> ${xpGain}</p>
  `;
  showStep('step-confirm');

 // Step 3 → record the catch, now with geo coords
confirmCatchBtn.onclick = () => {
  // 1) Update session score & XP
  currentAngler.sessionScore += finalScore;
  currentAngler.xp          += xpGain;
  maybeLevelUp(currentAngler);

  // 2) Build the base entry with null coords
  const entry = {
    angler:        currentAngler.name,
    fish:          currentFish,
    length:        currentLength,
    weight,
    score:         finalScore,
    timestamp:     new Date().toLocaleString(),
    tier:          tierObj.name,
    legendaryName,
    lat:           null,
    lng:           null
  };

  // 3) Attempt to get a geo-fix, then push & finalize
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        entry.lat = pos.coords.latitude.toFixed(6);
        entry.lng = pos.coords.longitude.toFixed(6);
        logEntries.unshift(entry);
        finishCatch();
      },
      err => {
        console.warn('Geo failed:', err.message);
        logEntries.unshift(entry);
        finishCatch();
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  } else {
    // No geo support
    logEntries.unshift(entry);
    finishCatch();
  }
};

// Helper to DRY up the post-catch logic
function finishCatch() {
  renderLog();
  renderScoreboard();
  updateUndo();
  saveProfiles(profiles);

  // Reset and return to game screen
  lengthInput.value = '';
  hide(catchFlowSection);
  show(gameSection);
}
});

// Cancel catch → back to game
cancelCatchBtn.addEventListener('click', () => {
  lengthInput.value = '';
  hide(catchFlowSection);
  show(gameSection);
});


  // Session & All-Time profile viewers
  function openSelectAngler(mode) {
    selectAnglerButtons.innerHTML='';
    profiles.forEach(p=>{
      const btn=document.createElement('button');
      btn.className='mode-btn';
      btn.textContent=p.name;
      btn.addEventListener('click',()=>{
        hide(selectAnglerModal);
        currentAngler=p;
        if(mode==='session'){
          renderSessionProfile(p); show(sessionPanel);
        } else {
          renderAlltimeProfile(p); show(alltimeModal);
        }
      });
      selectAnglerButtons.appendChild(btn);
    });
    show(selectAnglerModal);
  }

  // ===== Session Profile Rendering =====
function renderSessionProfile(p) {
  // Header
  document.getElementById('session-angler-name').textContent = p.name;

  // XP Wheel
  const xp   = p.xp;
  const nxt  = xpForLevel(p.level + 1);
  const pct  = Math.min(100, Math.round((xp / nxt) * 100));
  document.getElementById('session-xp-fill').style.width = pct + '%';
  document.getElementById('session-xp-text').textContent = `${xp}/${nxt} XP`;

  // Live timer (already hooked to updateSessionTime)
  // Fishing time is in the #session-time element

  // Gather this session’s catches for p
  const catches = logEntries.filter(e => e.angler === p.name);

  // 1) Renown tally
  const renownCounts = { Juvenile:0, Bronze:0, Silver:0, Gold:0, Diamond:0, Legendary:0 };
  catches.forEach(e => renownCounts[e.tier]++);
  const rt = document.getElementById('session-renown-tally');
  rt.innerHTML = '';  
  Object.entries(renownCounts).forEach(([tier, count]) => {
    rt.innerHTML += `<li>${tier}: ${count}</li>`;
  });

  // 2) Species tally
  const speciesCounts = {};
  catches.forEach(e => speciesCounts[e.fish] = (speciesCounts[e.fish] || 0) + 1);
  const st = document.getElementById('session-species-tally');
  st.innerHTML = '';
  Object.entries(speciesCounts).forEach(([fish, cnt]) => {
    st.innerHTML += `<li>${fish}: ${cnt}</li>`;
  });

  // 3) Biggest fish
  let biggest = catches.reduce((best, e) => e.weight > best.weight ? e : best, {weight:0});
  document.getElementById('session-biggest').textContent =
    biggest.weight
      ? `${biggest.fish} at ${biggest.weight} lbs`
      : '—';

  // 4) Most caught species
  let most = Object.entries(speciesCounts).sort((a,b) => b[1]-a[1])[0];
  document.getElementById('session-most-species').textContent =
    most ? `${most[0]} (${most[1]})` : '—';

  // 5) Average weight
  const totalW = catches.reduce((sum, e) => sum + e.weight, 0);
  const avgW   = catches.length ? (totalW / catches.length).toFixed(2) : '—';
  document.getElementById('session-avg-weight').textContent = avgW;
}

// Renders all-time (across all sessions) stats for angler p
function renderAlltimeProfile(p) {
  // Header
  document.getElementById('alltime-angler-name').textContent = p.name;

  // XP Wheel
  const xpA   = p.xp;
  const nxtA  = xpForLevel(p.level + 1);
  const pctA  = Math.min(100, Math.round((xpA / nxtA) * 100));
  document.getElementById('alltime-xp-fill').style.width = pctA + '%';
  document.getElementById('alltime-xp-text').textContent = `${xpA}/${nxtA} XP`;

  // Total fishing time
  document.getElementById('alltime-time').textContent =
    formatTime(p.totalFishingTime || 0);

  // Flatten all catches from every session
  const allCatches = (p.history || []).flatMap(sess => sess.catches);

  // 1) Renown tally
  const renownTotals = { Juvenile:0, Bronze:0, Silver:0, Gold:0, Diamond:0, Legendary:0 };
  allCatches.forEach(c => renownTotals[c.tier]++);
  const ar = document.getElementById('alltime-renown-tally');
  ar.innerHTML = '';
  Object.entries(renownTotals).forEach(([tier, cnt]) => {
    ar.innerHTML += `<li>${tier}: ${cnt}</li>`;
  });

  // 2) Species tally
  const speciesTotals = {};
  allCatches.forEach(c => speciesTotals[c.fish] = (speciesTotals[c.fish]||0)+1);
  const ast = document.getElementById('alltime-species-tally');
  ast.innerHTML = '';
  Object.entries(speciesTotals).forEach(([fish, cnt]) => {
    ast.innerHTML += `<li>${fish}: ${cnt}</li>`;
  });

  // 3) Biggest ever per species list
  const biggestEach = {};
  allCatches.forEach(c => {
    if (!biggestEach[c.fish] || c.weight > biggestEach[c.fish].weight) {
      biggestEach[c.fish] = { weight: c.weight };
    }
  });
  const abe = document.getElementById('alltime-biggest-each');
  abe.innerHTML = '';
  Object.entries(biggestEach).forEach(([fish, rec]) => {
    abe.innerHTML += `<li>${fish}: ${rec.weight} lbs</li>`;
  });

  // 4) Most caught species
  let mostA = Object.entries(speciesTotals).sort((a,b) => b[1]-a[1])[0];
  document.getElementById('alltime-most-species').textContent =
    mostA ? `${mostA[0]} (${mostA[1]})` : '—';

  // 5) Average weight across all
  const totalWeight = allCatches.reduce((sum,c)=>sum+c.weight,0);
  const avgAll      = allCatches.length
    ? (totalWeight / allCatches.length).toFixed(2)
    : '—';
  document.getElementById('alltime-avg-weight').textContent = avgAll;

  // 6) All-time catch log (optional – if you want it)
  const logEl = document.getElementById('alltime-log-list');
  logEl.innerHTML = allCatches.length
    ? allCatches.map(c=>`
        <li>${c.fish} (${c.tier}) – ${c.length}cm, ${c.weight}lbs
          ${c.legendaryName?`– <em>${c.legendaryName}</em>`:''}
        </li>`).join('')
    : '<li>No catches yet.</li>';
}

   // ── PDF EXPORT FUNCTION ──────────────────────────────────────
function buildSessionProfileHTML(p) {
  const catches = logEntries.filter(e => e.angler === p.name);
  const renownCounts = { Juvenile:0, Bronze:0, Silver:0, Gold:0, Diamond:0, Legendary:0 };
  const speciesCounts = {};
  let biggest = { fish:'', weight:0 };
  let totalW = 0;

  catches.forEach(e => {
    renownCounts[e.tier]++;
    speciesCounts[e.fish] = (speciesCounts[e.fish] || 0) + 1;
    if (e.weight > biggest.weight) biggest = { fish: e.fish, weight: e.weight };
    totalW += e.weight;
  });

  const mostCaught = Object.entries(speciesCounts)
    .sort((a,b) => b[1] - a[1])[0] || [];
  const avgWeight = catches.length ? (totalW / catches.length).toFixed(2) : '—';

  let html = `
    <h3>Session Profile &mdash; ${p.name}</h3>
    <p><strong>XP:</strong> ${p.xp} (Level ${p.level})</p>
    <p><strong>Session Time:</strong> ${formatTime(p.totalFishingTime||0)}</p>
    <h4>Renown Tally</h4><ul>`;
  Object.entries(renownCounts).forEach(([tier, cnt]) => {
    html += `<li>${tier}: ${cnt}</li>`;
  });
  html += `</ul><h4>Species Tally</h4><ul>`;
  Object.entries(speciesCounts).forEach(([fish, cnt]) => {
    html += `<li>${fish}: ${cnt}</li>`;
  });
  html += `</ul>
    <p><strong>Biggest Fish:</strong> ${biggest.weight ? `${biggest.fish} (${biggest.weight} lbs)` : '—'}</p>
    <p><strong>Most Caught Species:</strong> ${mostCaught.length ? `${mostCaught[0]} (${mostCaught[1]})` : '—'}</p>
    <p><strong>Average Weight:</strong> ${avgWeight} lbs</p>
  `;
  return html;
}

function buildAlltimeProfileHTML(p) {
  const allCatches = (p.history||[]).flatMap(sess => sess.catches||[]);
  const renownTotals = { Juvenile:0, Bronze:0, Silver:0, Gold:0, Diamond:0, Legendary:0 };
  const speciesTotals = {};
  const biggestEach = {};
  let totalW = 0;

  allCatches.forEach(c => {
    renownTotals[c.tier]++;
    speciesTotals[c.fish] = (speciesTotals[c.fish]||0) + 1;
    if (!biggestEach[c.fish] || c.weight > biggestEach[c.fish].weight) {
      biggestEach[c.fish] = { weight: c.weight };
    }
    totalW += c.weight;
  });

  const mostCaught = Object.entries(speciesTotals)
    .sort((a,b) => b[1] - a[1])[0] || [];
  const avgWeight = allCatches.length ? (totalW / allCatches.length).toFixed(2) : '—';

  let html = `
    <h3>All-Time Profile &mdash; ${p.name}</h3>
    <p><strong>Total Fishing Time:</strong> ${formatTime(p.totalFishingTime||0)}</p>
    <h4>Renown Tally</h4><ul>`;
  Object.entries(renownTotals).forEach(([tier, cnt]) => {
    html += `<li>${tier}: ${cnt}</li>`;
  });
  html += `</ul><h4>Species Tally</h4><ul>`;
  Object.entries(speciesTotals).forEach(([fish, cnt]) => {
    html += `<li>${fish}: ${cnt}</li>`;
  });
  html += `</ul><h4>Biggest Ever per Species</h4><ul>`;
  Object.entries(biggestEach).forEach(([fish, rec]) => {
    html += `<li>${fish}: ${rec.weight} lbs</li>`;
  });
  html += `</ul>
    <p><strong>Most Caught Species:</strong> ${mostCaught.length ? `${mostCaught[0]} (${mostCaught[1]})` : '—'}</p>
    <p><strong>Average Weight:</strong> ${avgWeight} lbs</p>
  `;
  return html;
}

// ─────────────── PROFILE HTML BUILDERS ───────────────────────

// Builds the session‐profile section for one angler
function buildSessionProfileHTML(p) {
  const entries = logEntries.filter(e => e.angler === p.name);
  const renown = { Juvenile:0, Bronze:0, Silver:0, Gold:0, Diamond:0, Legendary:0 };
  const species = {};
  let biggest = { fish:'', weight:0 }, totalW = 0;

  entries.forEach(e => {
    renown[e.tier] = (renown[e.tier]||0) + 1;
    species[e.fish]   = (species[e.fish] || 0) + 1;
    if (e.weight > biggest.weight) biggest = { fish: e.fish, weight: e.weight };
    totalW += e.weight;
  });
  const mostCaught   = Object.entries(species).sort((a,b)=>b[1]-a[1])[0] || [];
  const avgWeight    = entries.length ? (totalW/entries.length).toFixed(2) : '—';

  let html = `
    <h2>Session Profile — ${p.name}</h2>
    <p><strong>XP:</strong> ${p.xp} (Lvl ${p.level})</p>
    <p><strong>Session Time:</strong> ${formatTime(p.totalFishingTime||0)}</p>
    <h3>Renown Tally</h3>
    <ul>`;
  for (const [tier,c] of Object.entries(renown)) {
    html += `<li>${tier}: ${c}</li>`;
  }
  html += `</ul>
    <h3>Species Tally</h3>
    <ul>`;
  for (const [fish,c] of Object.entries(species)) {
    html += `<li>${fish}: ${c}</li>`;
  }
  html += `</ul>
    <p><strong>Biggest Fish:</strong> ${biggest.weight ? `${biggest.fish} (${biggest.weight} lbs)` : '—'}</p>
    <p><strong>Most Caught Species:</strong> ${mostCaught.length ? `${mostCaught[0]} (${mostCaught[1]})` : '—'}</p>
    <p><strong>Average Weight:</strong> ${avgWeight} lbs</p>
  `;
  return html;
}

// Builds the all‐time profile section for one angler
function buildAlltimeProfileHTML(p) {
  const allCatches = (p.history||[]).flatMap(s => s.catches||[]);
  const renownTot  = { Juvenile:0, Bronze:0, Silver:0, Gold:0, Diamond:0, Legendary:0 };
  const speciesTot = {};
  const biggestEach= {};
  let totalW = 0;

  allCatches.forEach(c => {
    renownTot[c.tier] = (renownTot[c.tier]||0) + 1;
    speciesTot[c.fish] = (speciesTot[c.fish]||0) + 1;
    if (!biggestEach[c.fish] || c.weight > biggestEach[c.fish].weight) {
      biggestEach[c.fish] = { weight: c.weight };
    }
    totalW += c.weight;
  });
  const mostCaughtAll = Object.entries(speciesTot).sort((a,b)=>b[1]-a[1])[0]||[];
  const avgWeightAll  = allCatches.length ? (totalW/allCatches.length).toFixed(2) : '—';

  let html = `
    <h2>All-Time Profile — ${p.name}</h2>
    <p><strong>Total Fishing Time:</strong> ${formatTime(p.totalFishingTime||0)}</p>
    <h3>Renown Tally</h3>
    <ul>`;
  for (const [tier,c] of Object.entries(renownTot)) {
    html += `<li>${tier}: ${c}</li>`;
  }
  html += `</ul>
    <h3>Species Tally</h3>
    <ul>`;
  for (const [fish,c] of Object.entries(speciesTot)) {
    html += `<li>${fish}: ${c}</li>`;
  }
  html += `</ul>
    <h3>Biggest Ever per Species</h3>
    <ul>`;
  for (const [fish,rec] of Object.entries(biggestEach)) {
    html += `<li>${fish}: ${rec.weight} lbs</li>`;
  }
  html += `</ul>
    <p><strong>Most Caught Species:</strong> ${mostCaughtAll.length ? `${mostCaughtAll[0]} (${mostCaughtAll[1]})` : '—'}</p>
    <p><strong>Average Weight:</strong> ${avgWeightAll} lbs</p>
  `;
  return html;
}

// ─────────────── FULL REPORT EXPORT ─────────────────────────
function exportFullReportPDF() {
  const c = document.createElement('div');
  c.style.padding    = '20px';
  c.style.background = '#fff';
  c.style.color      = '#000';
  c.style.fontFamily = 'Arial, sans-serif';

  // Scoreboard & Catch Log
  c.innerHTML = `
    <h1>🎣 Only Fins – Full Session Report</h1>
    <h2>Scoreboard</h2>
    <ul>
      ${profiles.map(p=>
        `<li>${p.name} (Lvl ${p.level}): ${p.sessionScore||0} pts</li>`
      ).join('')}
    </ul>
    <h2>Catch Log</h2>
    <ul>
      ${logEntries.map(e=>`
        <li>${e.timestamp} – ${e.angler} caught ${e.fish}
            (${e.length}cm, ${e.weight}lbs) → ${e.score} pts
            ${e.tier?`– ${e.tier}`:''}
            ${e.legendaryName?`– <em>${e.legendaryName}</em>`:''}
        </li>`
      ).join('')}
    </ul>
    <hr>
  `;

  // Session & All-Time Profiles
  profiles.forEach(p => {
    c.innerHTML += buildSessionProfileHTML(p) + '<hr>';
    c.innerHTML += buildAlltimeProfileHTML(p)  + '<hr>';
  });

  html2pdf()
    .set({
      margin:       10,
      filename:     `FullReport_${new Date().toISOString().slice(0,10)}.pdf`,
      image:        { type:'jpeg', quality:0.98 },
      html2canvas:  { scale:2 },
      jsPDF:        { unit:'mm', format:'a4', orientation:'portrait' }
    })
    .from(c)
    .save();
}

// ─────────────── UPDATED END SESSION ────────────────────────
function endSession() {
  if (!confirm('End this fishing session?')) return;

  clearInterval(sessionTimerInterval);
  saveProfiles(profiles);

  if (confirm('Save Full Session Report as PDF?')) {
    exportFullReportPDF();
  }

  // Reset UI back to choose-anglers
  hide(gameSection, catchFlowSection, sessionProfile, document.getElementById('alltime-modal'));
  show(profileSection);

  // Clear session data
  logEntries = [];
  profiles.forEach(p => p.sessionScore = 0);
  renderProfiles();
}

// Rebind old handler
endSessionBtn.removeEventListener('click', endSession);
endSessionBtn.addEventListener('click', endSession);

}); // ← this closes the DOMContentLoaded listener