#!/usr/bin/env python3
"""
🐓 Francis le Coq — Bot Telegram pour lancer la Mini App
Configure ce bot pour ouvrir le jeu web hébergé sur GitHub Pages.
"""

import os
import logging
from telegram import Update, WebAppInfo, MenuButtonWebApp, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

BOT_TOKEN = os.environ.get("FRANCIS_BOT_TOKEN", "VOTRE_TOKEN_ICI")
WEBAPP_URL = os.environ.get("FRANCIS_WEBAPP_URL", "https://VOTRE_USERNAME.github.io/francis-le-coq/")

logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🐓 Jouer à Francis le Coq", web_app=WebAppInfo(url=WEBAPP_URL))]
    ])
    await update.message.reply_text(
        "🐓 **Francis le Coq** 🇫🇷\n\n"
        "Bienvenue ! Clique sur le bouton ci-dessous pour "
        "lancer le jeu et prendre soin de Francis !\n\n"
        "🐣 → 🐤 → 🐔 → 🐓 → 👴🐓",
        reply_markup=keyboard,
        parse_mode="Markdown",
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🐓 **Aide — Francis le Coq**\n\n"
        "/start — Lancer le jeu\n"
        "/help — Cette aide\n\n"
        "Le jeu s'ouvre directement dans Telegram !",
        parse_mode="Markdown",
    )


async def post_init(app: Application):
    """Configure le bouton Menu pour ouvrir directement la Mini App."""
    try:
        await app.bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="🐓 Jouer", web_app=WebAppInfo(url=WEBAPP_URL))
        )
        logging.info("Menu button configured for WebApp")
    except Exception as e:
        logging.warning(f"Could not set menu button: {e}")


def main():
    if BOT_TOKEN == "VOTRE_TOKEN_ICI":
        print("=" * 50)
        print("⚠️  CONFIGURATION REQUISE")
        print("=" * 50)
        print()
        print("1. Crée un bot via @BotFather sur Telegram")
        print("2. Active les Mini Apps : /newapp dans BotFather")
        print("3. Héberge le jeu sur GitHub Pages")
        print("4. Lance :")
        print()
        print("   FRANCIS_BOT_TOKEN=xxx \\")
        print("   FRANCIS_WEBAPP_URL=https://ton-user.github.io/francis-le-coq/ \\")
        print("   python bot.py")
        print()
        return

    app = Application.builder().token(BOT_TOKEN).post_init(post_init).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))

    print("🐓 Bot Francis le Coq lancé !")
    print(f"🌐 WebApp URL : {WEBAPP_URL}")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
