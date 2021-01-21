const thriftParser = require('@byted-ferry/parser');
const fs = require('fs');
const path = require('path');
const namespaceStructReg = /^(.+)\.([^.]+)$/;

const parseAstToNamespaceStructMap = (document, namespaceMap, services) => {
  const statements = document.statements;
  statements.forEach(statement => {
    const type = statement.type;
    if (type === 'StructDefinition' || type === 'EnumDefinition') {
      const namespaceAndStructName = statement.name.namespaceValue;
      let namespace = '';
      let structName = '';
      if (namespaceStructReg.test(namespaceAndStructName)) {
        namespace = RegExp.$1;
        structName = RegExp.$2;
      }
      let namespaceStructMap = namespaceMap[namespace];
      if (!namespaceStructMap) {
        namespaceStructMap = namespaceMap[namespace] = {};
      }
      namespaceStructMap[structName] = statement;
    } else if (type === 'ServiceDefinition') {
      services.push(statement);
    }
  });
};

const parseThriftFiles = (inDir, outDir) => {
  const namespaceMap = {};
  const services = [];
  const parseToAst = dir => {
    const files = fs.readdirSync(dir);
    files.forEach(fileName => {
      const fileOrDir = path.join(dir, fileName);
      const stats = fs.statSync(fileOrDir);
      const isFile = stats.isFile();
      if (isFile) {
        if (path.extname(fileName) === '.thrift') {
          const document = thriftParser.parse(fileOrDir);
          parseAstToNamespaceStructMap(document, namespaceMap, services);
        }
      } else {
        parseToAst(fileOrDir);
      }
    });
  };
  parseToAst(inDir);
  return { namespaceMap, services };
};

const getValue = (fieldType, context, namespaceMap) => {
  const type = fieldType.type;
  switch (type) {
    case 'StringKeyword':
      return 'mock的数据';
    case 'I64Keyword':
      return `${Date.now()}`;
    case 'I8Keyword':
    case 'ByteKeyword':
      return Math.round(Math.pow(2, 8) * Math.random());
    case 'I16Keyword':
      return Math.round(Math.pow(2, 16) * Math.random());
    case 'I32Keyword':
      return Math.round(Math.pow(2, 32) * Math.random());
    case 'DoubleKeyword':
      return Math.round(Math.pow(2, 64) * Math.random());
    case 'BoolKeyword':
      return Math.random() > 0.5;
    case 'BinaryKeyword':
      // TODO 处理二进制数据
      return new Int32Array(1000);
    case 'Identifier':
      if (namespaceStructReg.test(fieldType.namespaceValue)) {
        return parseStruct(RegExp.$1, RegExp.$2, namespaceMap, context);
      }
      return fieldType.namespaceValue;
    case 'ListType':
      return [getValue(fieldType.valueType, context, namespaceMap)];
    case 'MapType':
      return {
        key: getValue(fieldType.valueType, context, namespaceMap),
      };
    default:
      return;
  }
};

const parseStruct = (namespace, structName, namespaceMap, context) => {
  const structAst = namespaceMap[namespace][structName];
  if (!structAst) {
    console.log(namespace, structName);
  }
  let structContext = context[structAst.name.namespaceValue];
  if (!structContext) {
    structContext = context[structAst.name.namespaceValue] = {
      status: 'parsing',
    };
  } else if (structContext.status === 'parsing') {
    return null;
  } else if (structContext.status === 'parsed') {
    return structContext.fields;
  }
  let fields = [];
  if (structAst.type === 'StructDefinition') {
    fields = structAst.fields.map(field => {
      const comments = field.comments.map(comment => {
        return comment.value;
      });
      const key = field.name.value;
      const type = field.fieldType.type;
      const value = getValue(field.fieldType, context, namespaceMap);
      return {
        key,
        type,
        value,
        comments,
      };
    });
  } else {
    // 枚举类型
    fields = structAst.members.map(member => {
      const comments = member.comments.map(comment => {
        return comment.value;
      });
      const key = member.name.value;
      const type = member.initializer.type;
      const value = member.initializer.value.value;
      return {
        key,
        type,
        value,
        comments,
      };
    });
  }

  structContext.status = 'parsed';
  structContext.fields = fields;
  return fields;
};

const metaTemplate = `/* eslint-disable */
/**
 * @path {{apiPath}}
 * @method {{method}}
 * @type json
 * @params {{requestData}}
 * @headers {}
 * @desc {{comments}}
 */
`;

const mockFuncTemplate = `
function (params) {
  return {{responseData}}
}
`;

const astStructToJson = astStruct => {
  const context = {};
  astStruct &&
    astStruct.forEach(fieldAst => {
      const { key, type, value, comments } = fieldAst;
      switch (type) {
        case 'Identifier':
          context[key] = astStructToJson(value);
          break;
        case 'ListType':
          const list = [];
          value.map(item => {
            const Identifier = Array.isArray(item);
            if (Identifier) {
              list.push(astStructToJson(item));
            } else {
              // 暂时认为都是简单类型吧
              list.push(item);
            }
          });
          context[key] = list;
          break;
        case 'MapType':
          const Identifier =
            Array.isArray(value.key) && Array.isArray(value.key[0]); // 如果是多层数组的情况会有问题，后续要升级parse结构
          if (Identifier) {
            context[key] = astStructToJson(value.key);
          } else {
            context[key] = value;
          }
          break;
        default:
          context[
            key +
              (comments && comments.length
                ? `@comments${comments.join(' ')}EOF`
                : '')
          ] = value;
      }
    });
  return context;
};

const generateMocks = (mockMetaList, outDir) => {
  mockMetaList.forEach((mockMeta) => {
    const apiPath = mockMeta.apiPath;
    const fileName = apiPath.replace(/^\//, '').replace(/\//g, '_') + '.js';
    const outPath = path.resolve(outDir)
    const fullPath = path.join(outPath, fileName);
    console.log(fullPath)
    fs.mkdirSync(outPath, { recursive: true });
    fs.writeFileSync(
      fullPath,
      metaTemplate.replace(/\{\{([^}]+)\}\}/g, (all, key) => {
        return mockMeta[key] || key;
      }) +
        mockFuncTemplate.replace(/\{\{([^}]+)\}\}/g, (all, key) => {
          const json = astStructToJson(mockMeta[key]);
          json.error_no = 0;
          return JSON.stringify(json, null, 2)
            .split(/\n/g)
            .map((line, idx) => {
              if (idx) {
                return `  ${line}`.replace(
                  /@comments([\s\S]+)EOF":([\s\S]+)$/,
                  (all, comment, end) => {
                    return `":${end} // ` + comment;
                  },
                );
              }
              return line;
            })
            .join('\n');
        }),
    );
  })
};

const parseServices = (namespaceMap, services) => {
  const mockMetaList = []
  services.forEach(serviceAst => {
    const functions = serviceAst.functions;
    functions.forEach(func => {
      if (func.type === 'FunctionDefinition') {
        const funcName = func.name.value;
        const comments = func.comments.map(comment => {
          return comment.value;
        });
        let requestNamespace = '';
        let requestStructName = '';
        let requestNamespaceAndStruct = func.fields[0].fieldType.namespaceValue;
        if (namespaceStructReg.test(requestNamespaceAndStruct)) {
          requestNamespace = RegExp.$1;
          requestStructName = RegExp.$2;
        }
        const requestData = parseStruct(
          requestNamespace,
          requestStructName,
          namespaceMap,
          {},
        );

        let responseNamespace = '';
        let responseStructName = '';
        let responseNamespaceAndStruct = func.returnType.namespaceValue;
        if (namespaceStructReg.test(responseNamespaceAndStruct)) {
          responseNamespace = RegExp.$1;
          responseStructName = RegExp.$2;
        }
        const responseData = parseStruct(
          responseNamespace,
          responseStructName,
          namespaceMap,
          {},
        );
        const method = func.extensionConfig.method;
        const uri = func.extensionConfig.uri;
        mockMetaList.push({
          apiPath: uri,
          comments,
          method,
          requestData,
          responseData,
        })
      }
    });
  });

  return mockMetaList;
};



const parseThriftsToMocks = (inDir, outDir) => {

  const { namespaceMap, services } = parseThriftFiles(inDir);
  const mockMetaList = parseServices(namespaceMap, services);
  generateMocks(mockMetaList, outDir);

}

module.exports = parseThriftsToMocks;
