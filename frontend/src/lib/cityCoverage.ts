export interface CityCoverageRegion {
  name: string;
  suburbs: string[];
}

export interface CityCoverage {
  city: string;
  state: string;
  introduction: string;
  regions: CityCoverageRegion[];
}

export const cityCoverage = {
  perth: {
    city: 'Perth',
    state: 'Western Australia',
    introduction:
      'Bloom Print arranges florist-led delivery throughout metropolitan Perth, from the coast to the eastern hills and from Joondalup to Rockingham. Common delivery areas include the suburbs below.',
    regions: [
      {
        name: 'Perth CBD and inner suburbs',
        suburbs: [
          'Perth', 'Northbridge', 'Highgate', 'East Perth', 'West Perth', 'Leederville',
          'West Leederville', 'Mount Lawley', 'North Perth', 'South Perth', 'Victoria Park',
          'Burswood', 'Subiaco', 'Shenton Park', 'Nedlands', 'Crawley',
        ],
      },
      {
        name: 'Northern suburbs',
        suburbs: [
          'Dianella', 'Morley', 'Inglewood', 'Bedford', 'Bayswater', 'Maylands', 'Yokine',
          'Osborne Park', 'Tuart Hill', 'Balcatta', 'Stirling', 'Nollamara', 'Mirrabooka',
          'Malaga', 'Greenwood', 'Warwick', 'Duncraig', 'Hillarys', 'Joondalup',
          'Wanneroo', 'Ellenbrook',
        ],
      },
      {
        name: 'Western and coastal suburbs',
        suburbs: [
          'Claremont', 'Cottesloe', 'Mosman Park', 'Peppermint Grove', 'Swanbourne',
          'City Beach', 'Floreat', 'Wembley', 'Scarborough', 'Trigg', 'Karrinyup', 'Sorrento',
        ],
      },
      {
        name: 'Eastern suburbs and hills',
        suburbs: [
          'Belmont', 'Ascot', 'Redcliffe', 'Rivervale', 'Bassendean', 'Guildford', 'Midland',
          'Hazelmere', 'Forrestfield', 'Kalamunda', 'High Wycombe', 'Lesmurdie', 'Mundaring',
        ],
      },
      {
        name: 'Southern suburbs',
        suburbs: [
          'Como', 'Kensington', 'Cannington', 'Bentley', 'Wilson', 'Riverton', 'Applecross',
          'Mount Pleasant', 'Booragoon', 'Melville', 'Fremantle', 'East Fremantle',
          'South Fremantle', 'Cockburn Central', 'Canning Vale', 'Jandakot', 'Success',
          'Armadale', 'Rockingham',
        ],
      },
    ],
  },
  sydney: {
    city: 'Sydney',
    state: 'New South Wales',
    introduction:
      'Bloom Print coordinates local florist delivery across Greater Sydney, including the CBD, eastern suburbs, Inner West, North Shore, Northern Beaches, western Sydney and the south.',
    regions: [
      {
        name: 'Sydney CBD and eastern suburbs',
        suburbs: [
          'Sydney CBD', 'The Rocks', 'Barangaroo', 'Pyrmont', 'Surry Hills', 'Darlinghurst',
          'Paddington', 'Woolloomooloo', 'Potts Point', 'Elizabeth Bay', 'Redfern', 'Waterloo',
          'Alexandria', 'Zetland', 'Bondi', 'Bondi Junction', 'Bronte', 'Coogee', 'Randwick',
          'Maroubra', 'Rose Bay', 'Vaucluse', 'Double Bay',
        ],
      },
      {
        name: 'Inner West',
        suburbs: [
          'Newtown', 'Enmore', 'Marrickville', 'Dulwich Hill', 'Petersham', 'Leichhardt',
          'Annandale', 'Balmain', 'Rozelle', 'Drummoyne', 'Five Dock', 'Burwood', 'Strathfield',
          'Ashfield', 'Summer Hill', 'Haberfield',
        ],
      },
      {
        name: 'North Shore and northern suburbs',
        suburbs: [
          'North Sydney', 'Kirribilli', 'Neutral Bay', 'Cremorne', 'Mosman', 'Crows Nest',
          'St Leonards', 'Chatswood', 'Artarmon', 'Lane Cove', 'Willoughby', 'Gordon', 'Killara',
          'Lindfield', 'Pymble', 'Turramurra', 'Hornsby', 'Ryde', 'Macquarie Park', 'Epping',
        ],
      },
      {
        name: 'Northern Beaches',
        suburbs: [
          'Manly', 'Fairlight', 'Balgowlah', 'Freshwater', 'Curl Curl', 'Dee Why', 'Brookvale',
          'Collaroy', 'Narrabeen', 'Mona Vale', 'Avalon Beach',
        ],
      },
      {
        name: 'Western Sydney and the Hills',
        suburbs: [
          'Parramatta', 'Harris Park', 'Granville', 'Auburn', 'Lidcombe', 'Homebush',
          'Wentworth Point', 'Rhodes', 'Blacktown', 'Seven Hills', 'Castle Hill',
          'Baulkham Hills', 'Kellyville', 'Rouse Hill', 'Penrith',
        ],
      },
      {
        name: 'Southern Sydney and Sutherland Shire',
        suburbs: [
          'Mascot', 'Botany', 'Rockdale', 'Kogarah', 'Hurstville', 'Bexley', 'Kingsgrove',
          'Campsie', 'Bankstown', 'Liverpool', 'Sylvania', 'Miranda', 'Caringbah', 'Cronulla',
          'Sutherland',
        ],
      },
    ],
  },
  melbourne: {
    city: 'Melbourne',
    state: 'Victoria',
    introduction:
      'Bloom Print organises florist-led delivery across metropolitan Melbourne, covering the inner city, bayside, northern, eastern, south-eastern and western suburbs.',
    regions: [
      {
        name: 'Melbourne CBD and inner north',
        suburbs: [
          'Melbourne CBD', 'Docklands', 'Southbank', 'Carlton', 'Fitzroy', 'Collingwood',
          'Richmond', 'Abbotsford', 'East Melbourne', 'North Melbourne', 'West Melbourne',
          'Parkville', 'Brunswick', 'Brunswick East', 'Coburg', 'Northcote', 'Thornbury', 'Preston',
        ],
      },
      {
        name: 'Eastern suburbs',
        suburbs: [
          'Hawthorn', 'Kew', 'Balwyn', 'Camberwell', 'Canterbury', 'Surrey Hills', 'Box Hill',
          'Mont Albert', 'Blackburn', 'Nunawading', 'Doncaster', 'Templestowe', 'Ringwood',
          'Mitcham', 'Croydon',
        ],
      },
      {
        name: 'Bayside and southern suburbs',
        suburbs: [
          'South Melbourne', 'Port Melbourne', 'Albert Park', 'Middle Park', 'St Kilda',
          'Elwood', 'Brighton', 'Hampton', 'Sandringham', 'Bentleigh', 'Moorabbin',
          'Cheltenham', 'Mentone', 'Mordialloc', 'Dandenong', 'Keysborough', 'Springvale',
          'Glen Waverley', 'Mount Waverley', 'Clayton', 'Oakleigh',
        ],
      },
      {
        name: 'Western suburbs',
        suburbs: [
          'Footscray', 'Seddon', 'Yarraville', 'Spotswood', 'Williamstown', 'Newport', 'Altona',
          'Maribyrnong', 'Moonee Ponds', 'Essendon', 'Ascot Vale', 'Sunshine', 'Braybrook',
          'Deer Park', 'Caroline Springs', 'Point Cook', 'Werribee',
        ],
      },
      {
        name: 'Northern suburbs',
        suburbs: [
          'Essendon North', 'Pascoe Vale', 'Glenroy', 'Broadmeadows', 'Reservoir', 'Bundoora',
          'Greensborough', 'Heidelberg', 'Ivanhoe', 'Epping', 'Craigieburn',
        ],
      },
      {
        name: 'Inner south and south-east',
        suburbs: [
          'South Yarra', 'Prahran', 'Windsor', 'Toorak', 'Armadale', 'Malvern', 'Glen Iris',
          'Caulfield', 'Carnegie', 'Murrumbeena', 'Chadstone', 'Burwood', 'Mulgrave',
          'Noble Park', 'Narre Warren', 'Berwick', 'Cranbourne', 'Frankston',
        ],
      },
    ],
  },
  brisbane: {
    city: 'Brisbane',
    state: 'Queensland',
    introduction:
      'Bloom Print matches orders with local florists across Greater Brisbane, including the inner city, northside, southside, bayside and western suburbs.',
    regions: [
      {
        name: 'Brisbane CBD and inner suburbs',
        suburbs: [
          'Brisbane City', 'Fortitude Valley', 'New Farm', 'Teneriffe', 'Newstead', 'Spring Hill',
          'Bowen Hills', 'Kangaroo Point', 'South Brisbane', 'West End', 'Highgate Hill',
          'Woolloongabba', 'East Brisbane', 'Milton', 'Paddington', 'Red Hill', 'Kelvin Grove',
        ],
      },
      {
        name: 'Northside',
        suburbs: [
          'Albion', 'Clayfield', 'Ascot', 'Hamilton', 'Hendra', 'Nundah', 'Wavell Heights',
          'Chermside', 'Kedron', 'Stafford', 'Everton Park', 'Mitchelton', 'Aspley',
          'Carseldine', 'Bracken Ridge', 'North Lakes', 'Strathpine',
        ],
      },
      {
        name: 'Southside and Logan',
        suburbs: [
          'Annerley', 'Greenslopes', 'Coorparoo', 'Camp Hill', 'Holland Park', 'Mount Gravatt',
          'Upper Mount Gravatt', 'Sunnybank', 'Macgregor', 'Eight Mile Plains', 'Runcorn',
          'Calamvale', 'Moorooka', 'Salisbury', 'Acacia Ridge', 'Browns Plains',
          'Logan Central', 'Springwood',
        ],
      },
      {
        name: 'Eastern and bayside suburbs',
        suburbs: [
          'Bulimba', 'Hawthorne', 'Balmoral', 'Morningside', 'Cannon Hill', 'Carina',
          'Carindale', 'Tingalpa', 'Wynnum', 'Manly', 'Lota', 'Capalaba', 'Cleveland',
        ],
      },
      {
        name: 'Western suburbs and Ipswich corridor',
        suburbs: [
          'Toowong', 'Auchenflower', 'Taringa', 'Indooroopilly', 'St Lucia', 'Chapel Hill',
          'Kenmore', 'Jindalee', 'Mount Ommaney', 'Graceville', 'Sherwood', 'Corinda',
          'Oxley', 'Ipswich',
        ],
      },
    ],
  },
  adelaide: {
    city: 'Adelaide',
    state: 'South Australia',
    introduction:
      'Bloom Print coordinates local florist delivery throughout metropolitan Adelaide, from the CBD and inner suburbs to the coast, Adelaide Hills, northern and southern suburbs.',
    regions: [
      {
        name: 'Adelaide CBD and inner suburbs',
        suburbs: [
          'Adelaide CBD', 'North Adelaide', 'Kent Town', 'Norwood', 'Rose Park', 'Dulwich',
          'Unley', 'Parkside', 'Goodwood', 'Wayville', 'Mile End', 'Thebarton', 'Bowden',
          'Brompton', 'Prospect', 'Walkerville',
        ],
      },
      {
        name: 'Eastern suburbs and Adelaide Hills',
        suburbs: [
          'Burnside', 'Kensington', 'Magill', 'Tranmere', 'Campbelltown', 'Rostrevor',
          'Newton', 'Paradise', 'Athelstone', 'Mitcham', 'Blackwood', 'Belair', 'Stirling',
          'Crafers', 'Mount Barker',
        ],
      },
      {
        name: 'Northern suburbs',
        suburbs: [
          'Enfield', 'Blair Athol', 'Kilburn', 'Northgate', 'Klemzig', 'Modbury',
          'Tea Tree Gully', 'Mawson Lakes', 'Salisbury', 'Elizabeth', 'Golden Grove', 'Paralowie',
        ],
      },
      {
        name: 'Western and coastal suburbs',
        suburbs: [
          'Hindmarsh', 'West Croydon', 'Woodville', 'Findon', 'Fulham Gardens', 'Henley Beach',
          'Grange', 'West Lakes', 'Semaphore', 'Port Adelaide', 'Glenelg', 'Plympton',
          'Richmond', 'Brooklyn Park',
        ],
      },
      {
        name: 'Southern suburbs',
        suburbs: [
          'Edwardstown', 'Marion', 'Oaklands Park', 'Warradale', 'Brighton', 'Hove', 'Seacliff',
          'Hallett Cove', 'Morphett Vale', 'Noarlunga Centre', 'Reynella', 'Aberfoyle Park',
          'Flagstaff Hill',
        ],
      },
    ],
  },
  hobart: {
    city: 'Hobart',
    state: 'Tasmania',
    introduction:
      'Bloom Print arranges local florist delivery across Greater Hobart, including the central suburbs, northern corridor, Eastern Shore and Kingborough area.',
    regions: [
      {
        name: 'Central and inner Hobart',
        suburbs: [
          'Hobart', 'North Hobart', 'West Hobart', 'South Hobart', 'Battery Point', 'Sandy Bay',
          'Dynnyrne', 'Mount Stuart', 'New Town', 'Lenah Valley', 'Moonah', 'Lutana',
        ],
      },
      {
        name: 'Northern suburbs',
        suburbs: [
          'Glenorchy', 'Derwent Park', 'Goodwood', 'Montrose', 'Rosetta', 'Berriedale',
          'Claremont', 'Austins Ferry', 'Granton', 'Brighton', 'Bridgewater', 'Gagebrook',
          'Old Beach',
        ],
      },
      {
        name: 'Eastern Shore',
        suburbs: [
          'Rosny', 'Rosny Park', 'Bellerive', 'Howrah', 'Tranmere', 'Lindisfarne',
          'Geilston Bay', 'Risdon Vale', 'Warrane', 'Mornington', 'Cambridge',
          'Seven Mile Beach', 'Lauderdale', 'Rokeby', 'Clarendon Vale', 'Sorell',
        ],
      },
      {
        name: 'Southern suburbs and Kingborough',
        suburbs: [
          'Taroona', 'Kingston', 'Kingston Beach', 'Blackmans Bay', 'Bonnet Hill',
          'Huntingfield', 'Margate', 'Snug', 'Electrona', 'Kettering', 'Fern Tree',
        ],
      },
    ],
  },
} satisfies Record<string, CityCoverage>;

export type CityCoverageKey = keyof typeof cityCoverage;
