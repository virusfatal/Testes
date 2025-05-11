#!/bin/bash

# @CLOVERMYT
# Canal: https://youtube.com/@clovermyt
# Canal WhatsApp: https://whatsapp.com/channel/0029Va974hY2975B61INGX3Q
# Instagram: https://www.instagram.com/clovermods?igsh=MmcyMHlrYnhoN2Zk
# Telegram: t.me/cinco_folhas
# Comunidade WhatsApp: https://chat.whatsapp.com/Kc5HLGCIokb37mA36NJrM6
# SE FOR REPOSTAR ME MARCA 🧙‍♂️🍀

# Definindo cores
NOCOLOR='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
LIGHTGRAY='\033[0;37m'
DARKGRAY='\033[1;30m'
LIGHTGREEN='\033[1;32m'
YELLOW='\033[1;33m'
LIGHTRED='\033[1;34m'
LIGHTPURPLE='\033[1;35m'
LIGHTCYAN='\033[1;36m'
WHITE='\033[1;37m'

# Função para exibir o logo
display_logo() {
    echo "${ORANGE}"
    cat << "EOF"
   ██░▀██████████████▀░███
   █▌▒▒░████████████░▒▒▐██
   █░▒▒▒░██████████░▒▒▒░██
   ▌░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░▐█
   ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░█
   ███▀▀▀██▄▒▒▒▒▒▒▒▄██▀▀▀█
   █░░░▐█░▀█▒▒▒▒▒█▀░█▌░░░█
   ▌░░░▐▄▌░▐▌▒▒▒▐▌░▐▄▌░░▐█
   █░░░▐█▌░░▌▒▒▒▐░░▐█▌░░██
   ▒▀▄▄▄█▄▄▄▌░▄░▐▄▄▄█▄▄▀▒█
   ░░░░░░░░░░└┴┘░░░░░░░░░█
   ██▄▄░░░░░░░░░░░░░░▄▄███
   ████████▒▒▒▒▒▒█████████
   █▀░░███▒▒░░▒░░▒▀███████
   █▒░███▒▒╖░░╥░░╓▒▐██████
   █▒░▀▀▀░░║░░║░░║░░██████
   ██▄▄▄▄▀▀┴┴╚╧╧╝╧╧╝┴┴████
   ███████████████████████
EOF
    echo 
}

# Loop principal
while : 
do
    display_logo
    echo "${YELLOW}         @CLOVERMYT"
    echo "${LIGHTPURPLE}"

    # Executa o script Node.js
    node index.js
    
    # Aguarda 1 segundo antes de reiniciar
    sleep 1
done