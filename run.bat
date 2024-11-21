echo off
REM check Enumerators from src/operation-enums to get values for PROVINCE, COUNTRY,...

REM Example Residency
REM npx ts-node src/index.ts -p "Alicante" --cita_op 22 --doc_type N --doc_num "NIE_NUM" --name "FIRSTNAME LASTNAME" --country "ALEMANIA" --birth-year 2010

REM Example NIE
REM ts-node src/index.ts -p "Madrid" --cita_op 4031 --doc_type P --doc_num "PASSPORT_NUM" --name "FIRSTNAME LASTNAME" --country "BELGICA" --birth-year 1990