import React from 'react';

import CharacteristicView from "./CharacteristicView";
import {useParams} from "react-router-dom";


export default function Characteristic() {
const {uri, viewMode} = useParams();
  return <CharacteristicView single uri={uri}/>
}