import { ButtonActions, Playground } from 'explang';
import React from 'react';
import { compileNaive } from '../../src/Evaluator/NaiveEvaluator';
import { createVirtualFileSystem } from '../../src/Parser/FileSystem/VirtualFileSystem';
import { prelude, samples } from './samples';
import { webWorkerEval } from './webWorkerEvaluator';

const fs = createVirtualFileSystem('/examples/', {
  '/prelude/Bool.ze': prelude.bool,
  '/prelude/Eq.ze': prelude.eq,
  '/prelude/List.ze': prelude.list,
  '/prelude/Maybe.ze': prelude.maybe,
  '/prelude/Num.ze': prelude.num,
  '/prelude/Ord.ze': prelude.ord,
  '/prelude/Prelude.ze': prelude.index,
});

const actions: ButtonActions = {
  Run: async (code, setOutput) => {
    fs.addFile('/examples/tmp.ze', code);
    const res = await compileNaive('/examples/tmp.ze', fs);

    if (res.type === 'ok') {
      const [, js] = res.value;
      const expr = await webWorkerEval(js);
      setOutput(JSON.stringify(expr, null, 2));
    } else {
      setOutput(res.value);
    }
  },
  Transpile: async (code, setOutput) => {
    fs.addFile('/examples/tmp.ze', code);
    const res = await compileNaive('/examples/tmp.ze', fs);

    if (res.type === 'ok') {
      const [, js] = res.value;
      setOutput(js);
    } else {
      setOutput(res.value);
    }
  },
};

export const App = () => (
  <Playground
    actions={actions}
    samples={samples}
    aceMode='haskell'
  />
);