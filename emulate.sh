#!/bin/bash
# Manually emulate ionic/cordova application
# 
ionic emulate ios --target="iPhone-6s"
echo "Emulating..."
cd ./platforms/ios/build/emulator
var=$(pwd)

ios-sim launch "$var"/*.app --devicetypeid="iPhone-6s, 9.2"
