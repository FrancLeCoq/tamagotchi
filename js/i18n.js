// ═══════════════════════════════════════════════════════════
// I18N — Bilingue EN (défaut) / FR
// Usage: I18n.t('key'), I18n.t('key',{n:5}), I18n.set('fr'|'en')
// HTML: <span data-i18n="key"></span>  → texte
//       data-i18n-html pour innerHTML
// ═══════════════════════════════════════════════════════════
var I18n = {
    lang: 'en',
    _listeners: [],

    DICT: {
        // ─── Splash ───
        splash_tagline:        {en:'RAISE FRANCIS · EVOLVE HIM',         fr:'ÉLÈVE FRANCIS · FAIS-LE ÉVOLUER'},
        splash_franc:          {en:'HOLDERS PLAY UNLIMITED',             fr:'LES HOLDERS JOUENT EN ILLIMITÉ'},
        btn_resume:            {en:'RESUME',                              fr:'REPRENDRE'},
        btn_new_game:          {en:'NEW GAME',                           fr:'NOUVELLE PARTIE'},
        connect_wallet:        {en:'Connect Wallet →',                   fr:'Connecter Wallet →'},
        franc_rules:           {en:'$FRANC RULES',                       fr:'RÈGLES $FRANC'},
        rule_without_a:        {en:'Without',                            fr:'Sans'},
        rule_without_b:        {en:'ENDS AFTER CHICK STAGE',             fr:'FIN APRÈS LE STADE POUSSIN'},
        rule_with_a:           {en:'With',                               fr:'Avec'},
        rule_with_b:           {en:'or',                                 fr:'ou'},
        rule_with_c:           {en:'UNLIMITED PLAY',                     fr:'JEU ILLIMITÉ'},
        record_label:          {en:'Longevity record',                  fr:'Record de longévité'},
        days_suffix:           {en:'days',                               fr:'jours'},
        lang_label:            {en:'Language',                           fr:'Langue'},
        lang_en:               {en:'English',                            fr:'Anglais'},
        lang_fr:               {en:'French',                             fr:'Français'},

        // ─── Stats panel ───
        stat_happiness:        {en:'Happiness',                          fr:'Bonheur'},
        stat_hunger:           {en:'Hunger',                             fr:'Faim'},
        stat_play:             {en:'Play',                               fr:'Jeu'},
        stat_energy:           {en:'Energy',                             fr:'Énergie'},
        stat_health:           {en:'Health',                            fr:'Santé'},
        stat_hygiene:          {en:'Hygiene',                            fr:'Hygiène'},
        stat_love:             {en:'Love',                               fr:'Amour'},
        level_n:               {en:'Level {n}',                          fr:'Niveau {n}'},

        // ─── Actions ───
        act_feed:              {en:'Feed',                               fr:'Nourrir'},
        act_play:              {en:'Play',                               fr:'Jouer'},
        act_sleep:             {en:'Sleep',                              fr:'Dormir'},
        act_wake:              {en:'Wake up',                            fr:'Réveiller'},
        act_cuddle:            {en:'Cuddle',                             fr:'Câliner'},
        act_heal:              {en:'Heal',                               fr:'Soigner'},

        // ─── Bottom nav ───
        nav_stats:             {en:'Stats',                              fr:'Stats'},
        nav_buildings:         {en:'Buildings',                          fr:'Bâtiments'},
        nav_sound:             {en:'Sound',                              fr:'Son'},
        nav_pause:             {en:'Pause',                              fr:'Pause'},
        nav_more:              {en:'More',                               fr:'Plus'},

        // ─── Overlays / headers ───
        hdr_care:              {en:'Care 💊',                            fr:'Soins 💊'},
        hdr_settings:          {en:'Settings',                           fr:'Paramètres'},
        hdr_feed:              {en:'Feed',                               fr:'Nourrir'},
        hdr_stats:             {en:'Statistics',                         fr:'Statistiques'},
        hdr_minigame:          {en:'Mini-game',                          fr:'Mini-jeu'},
        hdr_play:              {en:'Play 🎮',                            fr:'Jouer 🎮'},
        hdr_buildings:         {en:'Buildings 🏗️',                       fr:'Bâtiments 🏗️'},
        hdr_quests:            {en:'🎯 Daily quests',                    fr:'🎯 Quêtes du jour'},
        hdr_journal:           {en:'📔 Francis\u2019 journal',           fr:'📔 Journal de Francis'},

        care_heal:             {en:'Cure',                               fr:'Guérir'},
        care_toilet:           {en:'Toilet',                             fr:'Toilette'},
        care_shower:           {en:'Shower',                             fr:'Douche'},
        care_brush:            {en:'Brushing',                           fr:'Brossage'},
        more_journal:          {en:'Journal',                            fr:'Journal'},
        more_notif:            {en:'Notifications',                      fr:'Notifications'},
        more_wallet:           {en:'Wallet',                             fr:'Wallet'},
        more_reset:            {en:'Reset',                              fr:'Reset'},

        play_minigame:         {en:'Mini-game',                          fr:'Mini-jeu'},
        play_read:             {en:'Reading',                            fr:'Lecture'},
        play_sudoku:           {en:'Sudoku',                             fr:'Sudoku'},
        play_morpion:          {en:'Tic-tac-toe',                        fr:'Morpion'},
        play_catch:            {en:'Catch',                              fr:'Attrape'},
        play_roost:            {en:'Roost Clicker',                      fr:'Roost Clicker'},

        // ─── Evolution / wallet gate / death ───
        evo_title:             {en:'✨ Evolution! ✨',                    fr:'✨ Évolution ! ✨'},
        evo_ok:                {en:'Cock-a-doodle-doo!',                 fr:'Cocorico !'},
        wg_title:              {en:'🔒 Chick mode over!',                fr:'🔒 Mode Poussin terminé !'},
        wg_text:               {en:'Connect your wallet to unlock the rest!', fr:'Connecte ton wallet pour débloquer la suite !'},
        wg_connect:            {en:'🔗 Connect Wallet',                  fr:'🔗 Connecter Wallet'},
        wg_skip:               {en:'Restart as a chick →',               fr:'Recommencer en poussin →'},
        death_title:           {en:'Francis is gone...',                 fr:'Francis est parti...'},
        death_restart:         {en:'New egg 🥚',                         fr:'Nouvel œuf 🥚'},
        death_lived:           {en:'{nom} lived {d} days. Cause: {cause}', fr:'{nom} a vécu {d}j. Cause: {cause}'},

        // ─── Pause / birth ───
        pause_text:            {en:'PAUSE',                              fr:'PAUSE'},
        pause_resume:          {en:'▶ Resume',                           fr:'▶ Reprendre'},
        birth_skip:            {en:'Skip ▶',                             fr:'Passer ▶'},

        // ─── Farm ───
        farm_happiness:        {en:'Pen happiness',                      fr:'Bonheur enclos'},
        farm_feed:             {en:'Feed',                               fr:'Nourrir'},
        farm_clean:            {en:'Clean',                              fr:'Nettoyer'},
        farm_buy:              {en:'🐔 Buy (50🪙)',                       fr:'🐔 Acheter (50🪙)'},

        // ─── Toasts / dynamic (app.js) ───
        t_resume:              {en:'▶ Resumed!',                         fr:'▶ Reprise !'},
        t_notif_unsupported:   {en:'🔔 Notifications not supported on this device', fr:'🔔 Notifications non supportées sur cet appareil'},
        t_notif_already:       {en:'🔔 Notifications already enabled!',  fr:'🔔 Notifications déjà activées !'},
        t_notif_blocked:       {en:'🔕 Notifications blocked — allow them in your browser settings', fr:'🔕 Notifications bloquées — autorise-les dans les réglages du navigateur'},
        t_notif_on:            {en:'🔔 Notifications enabled!',          fr:'🔔 Notifications activées !'},
        t_notif_test:          {en:'Francis says hello! 🐓',             fr:'Francis te dit bonjour ! 🐓'},
        t_notif_refused:       {en:'🔕 Notifications declined',          fr:'🔕 Notifications refusées'},
        t_reset_confirm:       {en:'Reset?',                             fr:'Réinitialiser ?'},
        t_wallet_ok:           {en:'✅ Wallet connected!',               fr:'✅ Wallet connecté !'},
        t_born:                {en:'🥚 Francis is born!',                fr:'🥚 Francis est né !'},
        t_nothing_clean:       {en:'Nothing to clean!',                  fr:'Rien à nettoyer !'},

        // ─── Hints (renderer) ───
        hint_hunger:           {en:'🌾 Francis is hungry → Feed',        fr:'🌾 Francis a faim → Nourrir'},
        hint_energy:           {en:'😴 Francis is exhausted → Sleep',    fr:'😴 Francis est épuisé → Dormir'},
        hint_health:           {en:'❤️ Francis is sick → Heal',          fr:'❤️ Francis est malade → Soigner'},
        hint_hygiene:          {en:'🧼 Francis is dirty → Shower',       fr:'🧼 Francis est sale → Douche'},
        hint_love:             {en:'💕 Francis feels lonely → Cuddle',   fr:'💕 Francis se sent seul → Câliner'},
        hint_play:             {en:'🎮 Francis is bored → Play',         fr:'🎮 Francis s\u2019ennuie → Jouer'},

        // ─── Stages (engine) ───
        stage_chick:           {en:'Chick',                              fr:'Poussin'},
        stage_chick_f:         {en:'Chickette',                          fr:'Poussinette'},
        stage_little:          {en:'Little Rooster',                     fr:'Petit Coq'},
        stage_little_f:        {en:'Hennie',                             fr:'Cocotte'},
        stage_teen:            {en:'Teen Rooster',                       fr:'Coq Ado'},
        stage_teen_f:          {en:'Pullet',                             fr:'Poulette'},
        stage_adult:           {en:'Adult Rooster',                      fr:'Coq Adulte'},
        stage_adult_f:         {en:'Françoise',                          fr:'Françoise'},
        stage_old:             {en:'Old Rooster',                        fr:'Coq Vieux'},
        stage_old_f:           {en:'Granny Feather',                     fr:'Mamie Plume'},

        // ─── Food (engine) ───
        food_grain:            {en:'Grain',                              fr:'Grain'},
        food_mais:             {en:'Corn',                               fr:'Maïs'},
        food_baguette:         {en:'Baguette',                          fr:'Baguette'},
        food_graines:          {en:'Seeds',                              fr:'Graines'},
        food_gateau:           {en:'Cake',                               fr:'Gâteau'},
        food_fromage:          {en:'Cheese',                             fr:'Fromage'},

        // ─── Housing (engine) ───
        house_poulailler:      {en:'Henhouse',                           fr:'Poulailler'},
        house_bois:            {en:'Wooden house',                       fr:'Maison en bois'},
        house_brique:          {en:'Brick house',                        fr:'Maison en brique'},
        house_chateau:         {en:'Castle',                             fr:'Château'},
        house_palace:          {en:'Palace',                             fr:'Palace'},
        house_spacex:          {en:'SpaceX',                             fr:'SpaceX'},

        // ─── Events (features) ───
        ev_fox_title:          {en:'The foxes attack!',                  fr:'Les renards attaquent !'},
        ev_fox_text:           {en:'Foxes are invading the henhouse! What do you do?', fr:'Les renards envahissent le poulailler ! Que fais-tu ?'},
        ev_fox_c1:             {en:'Hide Francis + call the hunter 🔫',  fr:'Cacher Francis + appeler le chasseur 🔫'},
        ev_fox_c2:             {en:'Hide Francis without paying 🙈',     fr:'Cacher Francis sans payer 🙈'},
        ev_fox_r1:             {en:'The hunter secures the henhouse! (-{c} 🪙)', fr:'Le chasseur sécurise le poulailler ! (-{c} 🪙)'},
        ev_fox_r2:             {en:'Francis was devoured by the foxes... 💀', fr:'Francis a été dévoré par les renards... 💀'},
        ev_fox_death:          {en:'Devoured by the foxes',              fr:'Dévoré par les renards'},

        ev_storm_title:        {en:'Storm!',                             fr:'Tempête !'},
        ev_storm_text:         {en:'A storm is raging! What do you do?', fr:'Une tempête fait rage ! Que fais-tu ?'},
        ev_storm_c1:           {en:'Hide Francis 🏠',                    fr:'Cacher Francis 🏠'},
        ev_storm_c2:           {en:'Learn to fly 🪽',                    fr:'Apprendre à voler 🪽'},
        ev_storm_r1:           {en:'Francis takes shelter, the weather calms down...', fr:'Francis se met à l\u2019abri, le temps se calme...'},
        ev_storm_r2:           {en:'Francis flew away... and never came back 💀', fr:'Francis s\u2019est envolé... et n\u2019est jamais revenu 💀'},
        ev_storm_death:        {en:'Carried off by the storm',           fr:'Emporté par la tempête'},

        ev_sick_title:         {en:'PANDEMIC — Covid19!',                fr:'PANDÉMIE — Covid19 !'},
        ev_sick_text:          {en:'A pandemic hits the henhouse! Do you vaccinate Francis?', fr:'Une pandémie frappe le poulailler ! Vaccines-tu Francis ?'},
        ev_sick_c1:            {en:'Vaccinate 💉',                       fr:'Vacciner 💉'},
        ev_sick_c2:            {en:'No vaccine 🚫',                      fr:'Pas de vaccin 🚫'},
        ev_sick_r1:            {en:'Vaccinated! Health back to 100% 💪', fr:'Vacciné ! Santé à 100% 💪'},
        ev_sick_r2:            {en:'Disaster... Health dropped to 0%!',  fr:'Catastrophe... Santé tombée à 0% !'},

        ev_friend_title:       {en:'Chantal\u2019s visit',               fr:'Visite de Chantal'},
        ev_friend_text:        {en:'Chantal, his breeder, comes to visit him!', fr:'Chantal, son éleveuse, vient lui rendre visite !'},
        ev_friend_c1:          {en:'Give a hug 🤗',                      fr:'Faire un câlin 🤗'},
        ev_friend_c2:          {en:'Collect the eggs 🥚',               fr:'Récupérer les œufs 🥚'},
        ev_friend_r1:          {en:'+40% love 💕',                       fr:'+40% amour 💕'},
        ev_friend_r2:          {en:'+50 eggs! 🥚',                       fr:'+50 œufs ! 🥚'},

        ev_band_hunter:        {en:'🔫 The hunter secures the henhouse', fr:'🔫 Le chasseur sécurise le poulailler'},
        ev_band_shelter:       {en:'🏠 Francis is sheltered',           fr:'🏠 Francis est à l\u2019abri'},
        ev_band_love:          {en:'💕 +40% love',                      fr:'💕 +40% amour'},
        ev_band_eggs:          {en:'🥚 +50 eggs!',                      fr:'🥚 +50 œufs !'},
        ev_band_vaccine:       {en:'💉 Vaccination in progress',        fr:'💉 Vaccination en cours'},
        ev_toast_secured:      {en:'✅ Henhouse secured!',              fr:'✅ Poulailler sécurisé !'},
        ev_toast_stormgone:    {en:'☀️ The storm has passed!',          fr:'☀️ La tempête est passée !'},
        ev_sick_choose:        {en:'Make your choice!',                  fr:'Fais ton choix !'},
        ev_sick_alarm:         {en:'🚨 HEALTH ALERT 🚨',                fr:'🚨 ALERTE SANITAIRE 🚨'},

        // ─── Quests (features) ───
        q_feed3:               {en:'Feed Francis 3 times',               fr:'Nourrir Francis 3 fois'},
        q_play2:               {en:'Play 2 times',                       fr:'Jouer 2 fois'},
        q_wash1:               {en:'Wash Francis once',                  fr:'Laver Francis 1 fois'},
        q_happy80:             {en:'Reach 80% happiness',                fr:'Atteindre 80% de bonheur'},
        q_caress5:             {en:'Pet Francis 5 times',                fr:'Caresser Francis 5 fois'},
        q_eggs5:               {en:'Collect 5 eggs',                     fr:'Récolter 5 œufs'},
        q_heal1:               {en:'Heal Francis once',                  fr:'Soigner Francis 1 fois'},
        q_study1:              {en:'Make Francis read once',             fr:'Faire lire Francis 1 fois'},
        q_done_toast:          {en:'🎯 Quest complete! Go claim it',     fr:'🎯 Quête accomplie ! Va la réclamer'},
        q_claim:               {en:'Claim +{r}🪙',                       fr:'Réclamer +{r}🪙'},
        q_claimed:             {en:'✅ Done',                            fr:'✅ Fait'},
        q_reward:              {en:'+{r}🪙',                             fr:'+{r}🪙'},
        q_coins_toast:         {en:'🪙 +{r} coins!',                     fr:'🪙 +{r} pièces !'},
        q_success_journal:     {en:'🎯 Quest done: {t} (+{r} 🪙)',       fr:'🎯 Quête réussie : {t} (+{r} 🪙)'},

        // ─── Journal (features) ───
        j_empty:               {en:'Francis\u2019 journal is empty for now. Go on adventures!', fr:'Le journal de Francis est vide pour l\u2019instant. Vis des aventures !'},
        j_day:                 {en:'📅 Day {n} — {line}',                fr:'📅 Jour {n} — {line}'},
        j_line1:               {en:'A new day begins for Francis.',      fr:'Une nouvelle journée commence pour Francis.'},
        j_line2:               {en:'Francis slept well and crows!',      fr:'Francis a bien dormi et chante le coq !'},
        j_line3:               {en:'The sun shines on the henhouse.',    fr:'Le soleil brille sur le poulailler.'},
        j_line4:               {en:'Francis feels great today.',         fr:'Francis se sent en pleine forme aujourd\u2019hui.'},
        j_line5:               {en:'Another day in the life of Francis!', fr:'Encore un jour de gagné dans la vie de Francis !'},

        // ─── Weather labels (features) ───
        w_rain:                {en:'🌧️ Rain — mood dropping',            fr:'🌧️ Pluie — humeur en baisse'},
        w_sun:                 {en:'☀️ Bright sun — Francis is boosted!', fr:'☀️ Grand soleil — Francis est boosté !'},
        w_night:               {en:'🌙 Calm night',                      fr:'🌙 Nuit calme'},
        w_mild:                {en:'⛅ Mild weather',                     fr:'⛅ Temps doux'},

        // ─── Minigames (Attrape les grains) ───
        mg_grains_title:       {en:'Catch the grains! 🌾',               fr:'Attrape les grains ! 🌾'},
        mg_grains_h:           {en:'Catch the grains',                   fr:'Attrape les grains'},
        mg_grains_p:           {en:'Tap the food that appears!<br>🌾 = +1 · 🌽🥖🧀 = +2 · 🐛 = penalty<br>Each item caught fills the <b>Play</b> gauge 🎮', fr:'Tape sur les aliments qui apparaissent !<br>🌾 = +1 · 🌽🥖🧀 = +2 · 🐛 = malus<br>Chaque aliment attrapé remplit la jauge <b>Jeu</b> 🎮'},
        mg_go:                 {en:'Let\u2019s go! 🐓',                   fr:'C\u2019est parti ! 🐓'},
        mg_grains_score:       {en:'Score: {s}',                         fr:'Score : {s}'},
        mg_grains_result:      {en:'🎮 +{j}% play gauge',                fr:'🎮 +{j}% jauge jeu'},
        mg_collect:            {en:'Collect! 🐓',                        fr:'Récolter ! 🐓'},

        // ─── Health alerts (app) ───
        al_50:                 {en:'⚠️ Francis isn\u2019t doing well ({b}%)!', fr:'⚠️ Francis ne va pas bien ({b}%) !'},
        al_25:                 {en:'🚨 ALERT: Francis is doing very badly ({b}%)!', fr:'🚨 ALERTE : Francis va très mal ({b}%) !'},
        al_10:                 {en:'💀 CRITICAL DANGER: Francis is in mortal danger ({b}%)!', fr:'💀 DANGER CRITIQUE : Francis est en danger de mort ({b}%) !'},
        al_5:                  {en:'☠️ ABSOLUTE EMERGENCY! Francis is dying ({b}%)!!', fr:'☠️ URGENCE ABSOLUE ! Francis agonise ({b}%) !!'},
        al_0:                  {en:'😇 The reaper has come... Our deepest condolences.', fr:'😇 La faucheuse est passée... Toutes nos condoléances.'},
        cause_hungry:          {en:'He\u2019s starving!',                 fr:'Il a super faim !'},
        cause_tired:           {en:'He\u2019s exhausted!',                fr:'Il est épuisé !'},
        cause_sick:            {en:'He\u2019s very sick!',                fr:'Il est très malade !'},
        cause_dirty:           {en:'His hygiene is critical!',            fr:'Son hygiène est critique !'},
        cause_lonely:          {en:'He feels abandoned!',                 fr:'Il se sent abandonné !'},
        cause_bored:           {en:'He\u2019s bored!',                    fr:'Il s\u2019ennuie !'},
        born_notif:            {en:'🐣 Francis is born!',                 fr:'🐣 Francis est né !'},

        // ─── Engine action messages ───
        m_feed:                {en:'🍽️ {f}!',                           fr:'🍽️ {f} !'},
        m_fun:                 {en:'🎮 Fun!',                            fr:'🎮 Fun !'},
        m_nap_stop:            {en:'⏹️ Nap interrupted',                 fr:'⏹️ Sieste interrompue'},
        m_sleep:               {en:'💤 Sleepy time...',                  fr:'💤 Dodo...'},
        m_injection:           {en:'💉 Shot!',                           fr:'💉 Piqûre !'},
        m_pill:                {en:'💊 Pill!',                           fr:'💊 Cachet !'},
        m_nothing_clean:       {en:'Nothing to clean!',                  fr:'Rien à nettoyer !'},
        m_clean:               {en:'🧹 Clean!',                          fr:'🧹 Propre !'},
        m_shower:              {en:'🚿 Shower!',                         fr:'🚿 Douche !'},
        m_visit:               {en:'💕 {h}!',                            fr:'💕 {h} !'},
        m_read:                {en:'📖 Reading!',                        fr:'📖 Lecture !'},
        m_intellect:           {en:'🧠 +{n} intellect',                  fr:'🧠 +{n} intellect'},
        m_house:               {en:'🏠 {h}!',                            fr:'🏠 {h} !'},
        m_max_reached:         {en:'Max reached!',                       fr:'Max atteint !'},
        m_not_enough:          {en:'Not enough 🪙 ({c})',                fr:'Pas assez de 🪙 ({c})'},
        m_free:                {en:'Free',                               fr:'Gratuit'},
        cheat_coins:           {en:'💰 +50000 coins!',                   fr:'💰 +50000 pièces !'},
        info_stage:            {en:'Stage',                              fr:'Stade'},
        info_age:              {en:'Age',                                fr:'Âge'},
        food_plus:             {en:'+{n}🌾',                             fr:'+{n}🌾'},

        // ─── Death causes ───
        cause_famine:          {en:'Starvation',                        fr:'Famine'},
        cause_illness:         {en:'Illness',                           fr:'Maladie'},
        cause_depression:      {en:'Depression',                        fr:'Dépression'},
        cause_unknown:         {en:'unknown',                           fr:'inconnue'},
        m_gone:                {en:'Francis is no longer here...',       fr:'Francis n\u2019est plus là...'},

        // ─── Scene activity labels (renderer) ───
        lbl_eating:            {en:'🍽️ Francis is eating',               fr:'🍽️ Francis mange'},
        lbl_reading:           {en:'📖 Francis is reading',              fr:'📖 Francis lit'},
        lbl_washing:           {en:'🚿 Francis is washing',             fr:'🚿 Francis se lave'},
        lbl_cleaning:          {en:'🧹 Cleaning',                        fr:'🧹 Nettoyage'},
        lbl_healing:           {en:'🚨 Treatment in progress',           fr:'🚨 Soin en cours'},
        lbl_brushing:          {en:'🪥 Francis is brushing',             fr:'🪥 Francis se brosse'},
        lbl_intimate:          {en:'💕 Tender moment',                   fr:'💕 Moment intime'},
        lbl_sleeping:          {en:'💤 Francis is sleeping',             fr:'💤 Francis dort'},

        // ─── Farm / enclosure (farm.js) ───
        f_pen_full:            {en:'Pen full! (max {n})',                fr:'Enclos plein ! (max {n})'},
        f_need:                {en:'You need {c} 🪙 (you have {h})',     fr:'Il faut {c} 🪙 (tu as {h})'},
        f_new_hen:             {en:'🐔 New hen! ({h}/{m})',               fr:'🐔 Nouvelle poule ! ({h}/{m})'},
        f_no_hens:             {en:'No hens!',                           fr:'Pas de poules !'},
        f_fed:                 {en:'🌾 Pen fed!',                        fr:'🌾 Enclos nourri !'},
        f_cleaned:             {en:'🧹 Pen cleaned!',                    fr:'🧹 Enclos nettoyé !'},
        f_hens_died:           {en:'💀 {n} hen(s) died of Francis\u2019 sorrow!', fr:'💀 {n} poule(s) ont succombé au chagrin de Francis !'},
        f_no_eggs:             {en:'No eggs to collect',                 fr:'Aucun œuf à ramasser'},
        f_eggs_coins:          {en:'🥚→🪙 +{n} coins!',                  fr:'🥚→🪙 +{n} pièces !'},

        // ─── Catch food game ───
        mg_catch_title:        {en:'Catch the food! 🌽',                 fr:'Attrape la nourriture ! 🌽'},
        mg_catch_intro:        {en:'<div class="mini-intro"><div style="font-size:54px">🌽</div><h3>Catch the food</h3><p>Hold your finger on Francis and move him<br>to catch the falling food!<br>⚠️ Avoid the <b>☠️ poison</b> (or you lose)<br>Reward: <b>+30% play</b> 🎮 and <b>hunger</b> 🍽️</p><button class="mini-btn" id="mg-start">Let\u2019s go! 🐓</button></div>',
                                fr:'<div class="mini-intro"><div style="font-size:54px">🌽</div><h3>Attrape la nourriture</h3><p>Maintiens le doigt sur Francis et déplace-le<br>pour attraper la nourriture qui tombe !<br>⚠️ Évite le <b>☠️ poison</b> (sinon perdu)<br>Gain : <b>+30% jeu</b> 🎮 et <b>faim</b> 🍽️</p><button class="mini-btn" id="mg-start">C\u2019est parti ! 🐓</button></div>'},
        mg_poison_title:       {en:'Poison caught!',                     fr:'Poison attrapé !'},
        mg_poison_desc:        {en:'No reward this time...<br>Avoid the ☠️ next time!', fr:'Aucun gain cette fois...<br>Évite le ☠️ la prochaine fois !'},
        mg_too_bad:            {en:'Too bad 🐓',                         fr:'Dommage 🐓'},
        mg_caught:             {en:'Caught: {n}',                        fr:'Attrapés : {n}'},
        mg_catch_result:       {en:'🎮 +30% play<br>🍽️ +{f}% hunger',    fr:'🎮 +30% jeu<br>🍽️ +{f}% faim'},
        mg_harvest:            {en:'Collect! 🐓',                        fr:'Récolter ! 🐓'},

        // ─── Roost clicker ───
        mg_roost_title:        {en:'Roost Clicker! 👆',                  fr:'Roost Clicker ! 👆'},
        mg_roost_intro:        {en:'<div class="mini-intro"><div style="font-size:54px">👆</div><h3>Roost Clicker</h3><p>Tap Francis as much as you can in 60 seconds!<br>Each tap earns <b>×2 coins</b> 🪙<br>and you gain <b>+20% in the Play gauge</b> 🎮</p><button class="mini-btn" id="mg-start">Let\u2019s go! 🐓</button></div>',
                                fr:'<div class="mini-intro"><div style="font-size:54px">👆</div><h3>Roost Clicker</h3><p>Tapote Francis un max en 60 secondes !<br>Chaque tap rapporte <b>×2 pièces</b> 🪙<br>et tu gagnes <b>+20% dans la jauge Jeu</b> 🎮</p><button class="mini-btn" id="mg-start">C\u2019est parti ! 🐓</button></div>'},
        mg_roost_coins:        {en:'{n} coins (×2!)',                    fr:'{n} pièces (×2 !)'},
        mg_roost_result:       {en:'🪙 +{c} coins<br>🎮 +20% play',      fr:'🪙 +{c} pièces<br>🎮 +20% jeu'},

        // ─── Tic-tac-toe ───
        mg_morpion_title:      {en:'Tic-tac-toe vs Bot ⭕',              fr:'Morpion vs Bot ⭕'},
        mg_your_turn:          {en:'Your move! You are ❌',              fr:'À toi de jouer ! Tu es ❌'},
        mg_bot_thinking:       {en:'🤖 The bot is thinking... ',         fr:'🤖 Le bot réfléchit... '},
        mg_bot_won:            {en:'The bot won! 🤖',                    fr:'Le bot a gagné ! 🤖'},
        mg_you_won:            {en:'🎉 You won!',                        fr:'🎉 Tu as gagné !'},
        mg_draw:               {en:'Draw! 🤝',                           fr:'Match nul ! 🤝'},

        // ─── Sudoku ───
        mg_sudoku_title:       {en:'Mini Sudoku 🧠',                     fr:'Mini Sudoku 🧠'},
        mg_solved:             {en:'Solved!',                            fr:'Résolu !'},
        mg_brilliant:          {en:'Brilliant! 🐓',                      fr:'Brillant ! 🐓'},
        mg_retry:              {en:'Try again...',                       fr:'Réessayer...'},
        mg_too_many:           {en:'Too many mistakes!',                  fr:'Trop d\u2019erreurs !'},
        mg_sudoku_stats:       {en:'Time: {t}s · Intellect bonus: +{b}',  fr:'Temps : {t}s · Bonus intellect : +{b}'},

        // ─── Wallet / $FRANC holder ───
        holder_connect:        {en:'Connect Wallet →',                   fr:'Connecter Wallet →'},
        holder_checking:       {en:'Checking…',                          fr:'Vérification…'},
        holder_connected:      {en:'$FRANC HOLDER · UNLIMITED',          fr:'$FRANC HOLDER · ILLIMITÉ'},
        holder_connected_sub:  {en:'✅ {bal} $FRANC detected',           fr:'✅ {bal} $FRANC détecté'},
        holder_nofranc:        {en:'No $FRANC found — tap to retry',     fr:'Aucun $FRANC — touchez pour réessayer'},
        holder_disconnected:   {en:'Tap to connect & unlock',            fr:'Touchez pour connecter & débloquer'},
        wallet_btn_unlocked:   {en:'$FRANC HOLDER · UNLIMITED ✅',        fr:'$FRANC HOLDER · ILLIMITÉ ✅'},
        wallet_btn_locked:     {en:'$FRANC HOLDER · UNLIMITED 🔒',        fr:'$FRANC HOLDER · ILLIMITÉ 🔒'},
        t_wallet_checking:     {en:'⏳ Checking $FRANC…',                 fr:'⏳ Vérification $FRANC…'},
        t_wallet_ok_franc:     {en:'✅ $FRANC holder — unlimited unlocked!', fr:'✅ Holder $FRANC — illimité débloqué !'},
        t_wallet_no_franc:     {en:'⚠️ Wallet linked but no $FRANC found', fr:'⚠️ Wallet lié mais aucun $FRANC trouvé'},

        // ─── Gate (fin du stade poussin sans $FRANC) ───
        gate_title:            {en:'🔒 The chick has grown up',          fr:'🔒 Le poussin a grandi'},
        gate_text:             {en:'Francis can\u2019t go further without $FRANC. Hold $FRANC to unlock unlimited evolution, events and buildings.', fr:'Francis ne peut aller plus loin sans $FRANC. Détenez du $FRANC pour débloquer l\u2019évolution illimitée, les événements et les bâtiments.'},
        gate_reaper_line:      {en:'To unlock the $FRANC Holder features, connect a wallet holding $FRANC.', fr:'Pour débloquer les features $FRANC Holder, connectez un wallet détenant du $FRANC.'},
        gate_connect:          {en:'🔗 Connect $FRANC wallet',           fr:'🔗 Connecter wallet $FRANC'},
        gate_restart:          {en:'Restart as a chick →',               fr:'Recommencer en poussin →'}
    },

    DIALOGUES:{
        faim:{
            fr:['J\u2019ai la dalle ! 🌾','Du grain, stp...','Mon ventre gargouille...','Nourris-moi ! Je dépéris !','Je mangerais bien un croissant... 🥐','Mon estomac crie famine !','Un grain... juste un grain...','Par Toutatis, du maïs !','Même une miette ferait l\u2019affaire...','Le frigo est vide ou quoi ?'],
            en:['I\u2019m starving! 🌾','Some grain, please...','My tummy is rumbling...','Feed me! I\u2019m wasting away!','I could go for a croissant... 🥐','My stomach is screaming!','One grain... just one grain...','By Toutatis, give me corn!','Even a crumb would do...','Is the fridge empty or what?']
        },
        fatigue:{
            fr:['Zzz... même les coqs dorment...','Je pique du bec...','Trop fatigué pour chanter... 😴','Une bonne sieste, vite !','Mes paupières sont lourdes...','Je tiens plus debout...','Un lit, par pitié !','Je bâille sans arrêt...','Mon énergie est à zéro !','Même les poules dorment mieux...'],
            en:['Zzz... even roosters sleep...','I\u2019m nodding off...','Too tired to crow... 😴','A good nap, quick!','My eyelids are heavy...','I can\u2019t stand anymore...','A bed, please!','I keep yawning...','My energy is at zero!','Even the hens sleep better...']
        },
        sale:{
            fr:['Ça pue ici... C\u2019est moi ? 🤢','Une douche, et vite !','Mon plumage est dans un état !','Je suis sale comme un cochon...','Beurk, je sens le poulailler...','Mes plumes collent... 🧼','Faut que je me lave, là !','L\u2019hygiène, c\u2019est important !','Mon béret est tout crado...','Même les mouches me fuient !'],
            en:['It stinks here... Is it me? 🤢','A shower, quick!','My feathers are a mess!','I\u2019m filthy as a pig...','Yuck, I smell like the henhouse...','My feathers are sticky... 🧼','I really need to wash!','Hygiene matters!','My beret is all grimy...','Even the flies avoid me!']
        },
        triste:{
            fr:['Personne ne me voit... 😢','Un coq sans ami est perdu.','Je me sens bien seul...','Un câlin, ça fait du bien...','Où sont mes amis ?','Mon cœur est lourd...','La solitude, c\u2019est dur...','Quelqu\u2019un veut bien jouer ?','Je m\u2019ennuie tout seul...','Un peu d\u2019amour svp... 💔'],
            en:['Nobody sees me... 😢','A rooster without a friend is lost.','I feel so lonely...','A hug feels good...','Where are my friends?','My heart feels heavy...','Loneliness is hard...','Anyone want to play?','I\u2019m bored all alone...','A little love please... 💔']
        },
        malade:{
            fr:['Côt côt... *tousse*...','Au secours ! 🏥','J\u2019ai besoin d\u2019un médecin... 💉','Je me sens tout flagada...','Ma crête est toute pâle...','J\u2019ai mal partout...','Docteur ! Docteur !','Un cachet, vite !','Je ne me sens pas bien du tout...','Mes plumes tombent...'],
            en:['Cluck cluck... *cough*...','Help! 🏥','I need a doctor... 💉','I feel all weak...','My comb looks pale...','I hurt all over...','Doctor! Doctor!','A pill, quick!','I don\u2019t feel well at all...','My feathers are falling out...']
        },
        jeu:{
            fr:['Je m\u2019ennuie ! 🎮','On joue à quoi ?','Un sudoku peut-être ?','Rien à faire ici...','Où est ma manette ?','C\u2019est long sans jeu...','Même un livre ferait l\u2019affaire 📖','Stimulez mon intellect !','Je vais rouiller sans activité !','On fait un mini-jeu ?'],
            en:['I\u2019m bored! 🎮','What shall we play?','Maybe a sudoku?','Nothing to do here...','Where\u2019s my controller?','It\u2019s long without games...','Even a book would do 📖','Stimulate my mind!','I\u2019ll rust without activity!','Shall we play a mini-game?']
        },
        enclos:{
            fr:['Les poules ont faim !','L\u2019enclos est sale...','Mes poules ont besoin d\u2019attention !','Vérifie l\u2019enclos stp...','Les œufs n\u2019attendent pas !','L\u2019hygiène de l\u2019enclos... 😬','Nourris les poules !'],
            en:['The hens are hungry!','The pen is dirty...','My hens need attention!','Check the pen please...','The eggs won\u2019t wait!','The pen\u2019s hygiene... 😬','Feed the hens!']
        }
    },

    init:function(){
        var saved=null;
        try{saved=localStorage.getItem('francis_lang');}catch(e){}
        this.lang=(saved==='fr'||saved==='en')?saved:'en';
        this.apply();
    },

    set:function(lang){
        if(lang!=='fr'&&lang!=='en')return;
        this.lang=lang;
        try{localStorage.setItem('francis_lang',lang);}catch(e){}
        try{document.documentElement.lang=lang;}catch(e){}
        this.apply();
        for(var i=0;i<this._listeners.length;i++){try{this._listeners[i](lang);}catch(e){}}
    },

    onChange:function(fn){if(typeof fn==='function')this._listeners.push(fn);},

    t:function(key,vars){
        var entry=this.DICT[key];
        var s=entry?(entry[this.lang]||entry.en):key;
        if(vars){for(var k in vars){if(vars.hasOwnProperty(k))s=s.split('{'+k+'}').join(vars[k]);}}
        return s;
    },

    // Applique les traductions aux éléments [data-i18n] / [data-i18n-html]
    apply:function(root){
        root=root||document;
        var els=root.querySelectorAll('[data-i18n]');
        for(var i=0;i<els.length;i++){
            var key=els[i].getAttribute('data-i18n');
            els[i].textContent=this.t(key);
        }
        var hels=root.querySelectorAll('[data-i18n-html]');
        for(var j=0;j<hels.length;j++){
            var hk=hels[j].getAttribute('data-i18n-html');
            hels[j].innerHTML=this.t(hk);
        }
    }
};
