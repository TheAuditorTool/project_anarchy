/**
 * Prettier Violations Test File
 * Phase 10: Contains 5 intentional Prettier formatting violations for TheAuditor validation
 * Errors 210-214
 */

// ERROR 210: Mixed quotes - single and double quotes inconsistently used
const message = "This uses double quotes";
const another = 'This uses single quotes';
const mixed = "Here's a " + 'mixed quote string';

// ERROR 211: Missing trailing commas in multi-line definitions
const objectWithoutTrailingComma = {
    name: "John",
    age: 30,
    email: "john@example.com"
};

const arrayWithoutTrailingComma = [
    "first",
    "second",
    "third"
];

// ERROR 212: Mixed tabs and spaces for indentation
function inconsistentIndentation() {
	const tabIndented = true;  // This line uses a tab
    const spaceIndented = false;  // This line uses spaces
	  const mixedIndent = "chaos";  // This line uses both tab and spaces
    return { tabIndented, spaceIndented, mixedIndent };
}

// ERROR 213: Excessively long line (>120 characters)
const veryLongLineOfCodeThatExceedsTheRecommendedCharacterLimitAndShouldBeWrappedForBetterReadabilityButIsNotCurrentlyWrapped = "This is a very long string that makes the line exceed 120 characters which Prettier would normally wrap";

// ERROR 214: Inconsistent spacing around brackets and braces
const inconsistentSpacing={foo:"bar",baz :  "qux"  };
const moreInconsistency = {  key1:'value1' ,key2:  'value2'};
const arraySpacing=[ 1,2 , 3  ,4];

function messyFormatting( param1,param2 ){
    if(param1===param2) {
        return{result:true,data:[1,2,3] };
    }else{
        return { result: false, data: [ ] };
    }
}

// Additional formatting inconsistencies
const   multipleSpaces   =    "too many spaces";
const noSpaces="no spaces around equals";

const nestedMess = {
items: [
{ id:1,name:"First" },
    {id: 2, name: 'Second'},
        { id :3 , name:"Third"}
]
};

module.exports={messyFormatting,inconsistentIndentation,
    objectWithoutTrailingComma,arrayWithoutTrailingComma,
inconsistentSpacing,moreInconsistency,
        nestedMess
};