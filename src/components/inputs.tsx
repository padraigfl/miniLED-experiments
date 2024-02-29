import { JSX } from "solid-js";

const getValueInRange = (value: number, minValue: number = 0, maxValue: number) => value < minValue ? minValue : value;

export const NumericInput = (props: { text: string, value: number, update: (n: number) => any, min: number, max: number}) =>
  <p style={{ background: 'black', outline: '1px solid white' }}>
    {props.text}: 
    <input type="number" value={props.value} min={props.min} max={props.max} onChange={e => props.update(getValueInRange(+e.target.value, props.min, props.max))} />
  </p>

export const SelectInput = (props: { text: string, options: (string | number)[], selectedIdx: number, update: (n: number) => any }) =>
  <p style={{ background: 'black', outline: '1px solid white' }}>
    {props.text}: 
    <select value={props.selectedIdx} onChange={e => props.update(+e.target.value)} style={{ "max-width": "320px" }}>
      {props.options.map((o, idx) => <option value={idx} disabled={idx === props.selectedIdx}>{o}</option>)}
    </select>
  </p>
