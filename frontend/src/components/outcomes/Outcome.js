import React from 'react';
import {useParams} from "react-router-dom";
import OutcomeView from "./OutcomeView";

export default function Outcome() {
  const {uri} = useParams();
  return <OutcomeView single/>
}
