function main() {
                return (arg => { 
 
                switch (arg.name) {
                    case "tuple":
                    return arg.args[0] + arg.args[1];
default:
                    throw new Error('pattern matching failed');
                } 
 })(({ name: "tuple", args: [3, 7] }));
            }

self.onmessage = () => self.postMessage(main());