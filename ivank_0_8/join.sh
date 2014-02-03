

cd events
bash join.sh
cd ..

cd geom
bash join.sh
cd ..

cd text
bash join.sh
cd ..

cd display
bash join.sh
cd ..

cat Utils.js geom/geom.js events/events.js display/display.js text/text.js > ivank.js
