# Francis le Coq — V42

## Wallet $FRANC (vérification réelle)
- Intégration du **vrai backend** (Supabase `check-franc`) identique à FrancRun : le statut $FRANC est vérifié côté serveur via `initData` Telegram.
- Le cadenas **$FRANC HOLDER** ouvre la Mini App `connect-wallet.html` (`t.me/FrancisLeCoqBot/wallet`) via `openTelegramLink`.
- **Re-vérification automatique** au retour de la page wallet (visibilitychange) et toutes les 20 s.
- Badge holder : **orange + cadenas fermé** si non connecté, **vert + cadenas ouvert** si $FRANC détecté (avec solde affiché). Présent sur l'accueil **et** en jeu (barre sous la top-bar).
- Si **$FRANC détecté → jeu totalement illimité**. Sinon, le jeu **s'arrête à la fin du stade poussin** : la faucheuse passe et un message bilingue invite à connecter un wallet $FRANC (« Pour débloquer les features $FRANC Holder… »).

## Langue
- Le menu déroulant est remplacé par **deux drapeaux cliquables** (🇬🇧 / 🇫🇷), plus jolis, avec surbrillance de la langue active et **réactualisation immédiate** de toute l'appli.

## Menu
- Correction du **double « $FRANC »** dans le titre (« $FRANC HOLDERS PLAY UNLIMITED »).

## Malade (Covid)
- **Un seul compte à rebours** à la fin (le doublon est supprimé).
- Suppression du label « Treatment in progress » de la seringue ; l'animation de vaccination (virus qui s'estompent) est conservée.

## Ami (Chantal)
- Chantal disparaît désormais **exactement** à la fin du compte à rebours (plus un peu avant).

## Renard
- Le bandeau précise le **coût de l'intervention** du chasseur (-X 🪙).
- **Animation des pièces perdues** au moment où le chasseur disparaît (montant + pièces qui s'envolent).

---

## (Rappel des changements V41 initiaux)


## Langue
- Nouveau menu déroulant **Choix de langue** sur l'écran d'accueil : **Anglais (par défaut)** / Français.
- Intégration bilingue complète : interface, écrans, boutons, événements, quêtes, journal, dialogues de Francis, mini-jeux, messages et notifications. Le choix est mémorisé.

## Notifications
- Les messages type « Francis est né » / « Francis ne va pas bien » sont désormais **2× plus grands** et affichés **tout en haut du décor de jeu** (plus sur la barre des jauges).

## Événements — comptes à rebours
- Tous les événements : **10 s au début** et **10 s à la fin** (au lieu de 5 s).
- Compte à rebours **rouge**, positionné à **70 % du bas** de la scène.

## Chantal
- Position **abaissée à 5 % du bas**.

## Renards
- Comptes à rebours alignés : 10 s avant / 10 s après, rouge, à 70 % du bas.
- **Nouveau renard** : remplacement par `renards.png` retravaillé (fond rendu transparent).

## Tempête
- Les tornades **ne tournoient plus** ; elles **se déplacent aléatoirement sur tout l'écran**.
- **Taille des tornades ×2**.
- **Pluie très forte garantie** pendant l'événement (le bug d'absence de pluie est corrigé).
- **Bug corrigé** : après une mort (« Apprendre à voler ») puis « Nouvelle partie », les tornades restaient à l'écran — la scène est maintenant entièrement nettoyée.

## Malade (Covid19)
- Animation Covid de **10 s** pour bien montrer les virus, avec **décor alarmiste sirène rouge/bleu**.
- Le choix est ensuite proposé au joueur.
- Animation de **vaccin sur 10 s**, avec les **virus qui s'estompent** progressivement.

## Attrape les grains
- **Retrait** du gain de pièces et du gain de faim.
- Désormais : **1 élément attrapé = 1 % de jauge de Jeu** (uniquement).

## Bâtiments
- **Palace** : position abaissée de 10 %.
- **SpaceX** : taille réduite de 30 %.

## Enclos
- La **couleur du ciel** de l'enclos est désormais **identique** à celle de la scène principale (mêmes valeurs RGB, synchronisées sur l'heure du jeu).
