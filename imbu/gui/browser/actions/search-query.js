/* -----------------------------------------------------------------------------
 * Copyright © 2015, Numenta, Inc. Unless you have purchased from
 * Numenta, Inc. a separate commercial license for this software code, the
 * following terms and conditions apply:
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero Public License for
 * more details.
 *
 * You should have received a copy of the GNU Affero Public License along with
 * this program. If not, see http://www.gnu.org/licenses.
 *
 * http://numenta.org/licenses/
 * -------------------------------------------------------------------------- */

'use strict';

import request from 'superagent';

const API_HOST = '/fluent';

//FIXME: Remove demo data once the API is stable
const DEMO = false;
const MOCK_RESULTS = [
  { "id": "1", "text": "Get rid of the trrible odor in the kitchen. It smells alot when we bring in lunch. Air freshners would help. Not candles though.", "score": Math.random()},
  { "id": "2", "text": "I don't care", "score": Math.random()},
  { "id": "3", "text": "WFH everyday!!! Get video calls set up so we can phone in", "score": Math.random()},
  { "id": "4", "text": "nothing", "score": Math.random()},
  { "id": "5", "text": "blah blah, like anyone will read this anyway", "score": Math.random()},
  { "id": "6", "text": "Sugestions/vote box. Could be used for (i) Wednesday lunch, (ii) office improvements, (iii) game/movie night requests, etc...", "score": Math.random()},
  { "id": "7", "text": "Better snacks! Stop people from stealing my food even after I labeled it. Its not right and it makes me ngry", "score": Math.random()},
  { "id": "8", "text": "stay golden, pony boy", "score": Math.random()},
  { "id": "9", "text": "once-a-week show at lunch -- i.e. lecture, tv show, documentary, etc.", "score": Math.random()},
  { "id": "10", "text": "more video games, board games, and scavenger hunts", "score": Math.random()},
  { "id": "11", "text": "love teh office, I wouldn't change a thing!", "score": Math.random()},
  { "id": "12", "text": "Better/more HEALTHY snacks. Otherwise the office is perfect.", "score": Math.random()},
  { "id": "13", "text": "I can't think of a better workplace environment!", "score": Math.random()},
  { "id": "14", "text": "[identifier deleted] gives each employee $10,000 to decorate their workspace… just sayin!", "score": Math.random()},
  { "id": "15", "text": "they've moved my desk four times already this year, and I used to be over by the window, and I could see the squirrels, and they were merry, but then, they switched from the Swingline to the Boston stapler, but I kept my Swingline stapler because it didn't bind up as much, and I kept the staples for the Swingline stapler and it's not okay because if they take my stapler then I'll set the building on fire... ", "score": Math.random()},
  { "id": "16", "text": "I wouldn't say no to trying tellpresience robots… or standing desks", "score": Math.random()},
  { "id": "17", "text": "The projector is misaligned and it BUGS the hell out of me. It was embarassing in the [identifier deleted] meeting when [identifier deleted] pinted it out!", "score": Math.random()},
  { "id": "18", "text": "The office is great, don't change anything. We should do more offsite activities though. Like a Giants game!", "score": Math.random()},
  { "id": "19", "text": "Showers. A lot of us bike to/from work and wouldn't mind cleaning up. We could also workout before work, or even at lunchtime if we want to", "score": Math.random()},
  { "id": "20", "text": "I wish to work in a unicorn-free environment", "score": Math.random()},
  { "id": "21", "text": "* snack-suggestion box  * bar * better/more beer", "score": Math.random()},
  { "id": "22", "text": "Move the office to SF :)", "score": Math.random()},
  { "id": "23", "text": "The Keurig is no good. We should have an arrngment with [identifier deleted] for discounts. Or at least we could have meetings at [identifier deleted]", "score": Math.random()},
  { "id": "24", "text": "1) fresher fruit  2) actual coffee  3) almond milk", "score": Math.random()},
  { "id": "25", "text": "I want to sit down druing stand up.", "score": Math.random()},
  { "id": "26", "text": "Sonos speakers, then a few of us could play some music and work together in a conference room. Otherwise all is well!", "score": Math.random()},
  { "id": "27", "text": "1) personal whiteboards at each desk 2) webcams in the confrnce rooms", "score": Math.random()},
  { "id": "28", "text": "Retrofit a conference room for a nap room", "score": Math.random()},
  { "id": "29", "text": "lecture series; guest lectures, videos, or we give them oursleves", "score": Math.random()},
  { "id": "30", "text": "chairs could be better", "score": Math.random()},
  { "id": "31", "text": "I love the office, wouldn't want to work anywere else. Maybe have more drinks and game nights", "score": Math.random()},
  { "id": "32", "text": "1- healthier snacks, 2- bring in dinner when working late, 3- allow for lunchtime workout; and maybe a gym membership at [identifier deleted] down the street?", "score": Math.random()},
  { "id": "33", "text": "fewer surveys", "score": Math.random()},
  { "id": "34", "text": "drones, video games, book club, beer", "score": Math.random()},
  { "id": "35", "text": "Supplies and tech are phenomnal, food is great, kitchen and bathrooms clean... I wouldnt change anyting.", "score": Math.random()},
];

export default (context, query) => {
  if (DEMO) {
    context.dispatch('SEARCH_RECEIVED_DATA', {'query'  :query,
                                              'results': MOCK_RESULTS});
  } else {
    return new Promise((resolve, reject) => {
      request
        .post(API_HOST)
        .send(query)
        .set('Accept', 'application/json')
        .set('Access-Control-Allow-Origin', '*')
        .end((error, results) => {
          if (error) {
            reject(error);
            console.error(error);
          } else {
            context.dispatch('SEARCH_RECEIVED_DATA',
                            {'query'  :query, 'results': results.body});
            resolve(results.body);
          }
        }
      );
    });
  }
};
