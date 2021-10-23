import datatypes from '../../examples/datatypes.ze?raw';
import grfi from '../../examples/grfi.ze?raw';
import lambdaEval from '../../examples/lambda_eval.ze?raw';
import primes from '../../examples/primes.ze?raw';
import patternMatching from '../../examples/pattern_matching.ze?raw';
import bool from '../../prelude/Bool.ze?raw';
import eq from '../../prelude/Eq.ze?raw';
import list from '../../prelude/List.ze?raw';
import maybe from '../../prelude/Maybe.ze?raw';
import num from '../../prelude/Num.ze?raw';
import ord from '../../prelude/Ord.ze?raw';
import index from '../../prelude/Prelude.ze?raw';

export const samples = {
  'Primes': primes,
  'Data types': datatypes,
  'Pattern Matching': patternMatching,
  'Lambda evaluator': lambdaEval,
  'Girafe interpreter': grfi,
};

export const prelude = {
  bool,
  eq,
  list,
  maybe,
  num,
  ord,
  index,
};