import { ModConfig, SQFFile } from '../types';

// Sanitize Arma 3 class names: lowercase, alphanumeric + underscores, no leading digits
const sanitizeClassName = (name: string): string => {
  let clean = name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (!clean) clean = 'my_mod';
  if (/^[0-9]/.test(clean)) clean = 'mod_' + clean;
  return clean;
};

export const generateConfigCPP = (config: ModConfig, files: SQFFile[], forcedPboName?: string) => {
  const pboName = forcedPboName || sanitizeClassName(config.name);
  const tag = (config.tag || 'MOD').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'MOD';
  const safeTag = /^[0-9]/.test(tag) ? 'TAG_' + tag : tag;

  const allFunctions = files.filter(f => f.functionName);

  let cpp = `class CfgPatches {
    class ${pboName} {
        name = "${config.name}";
        author = "${config.author}";
        url = "";
        version = "${config.version}";
        units[] = {};
        weapons[] = {};
        requiredVersion = 0.1;
        requiredAddons[] = {"A3_Data_F"};
    };
};

`;

  if (allFunctions.length > 0) {
    // postInit = 1 makes these functions auto-execute at mission start
    cpp += `class CfgFunctions {
    class ${safeTag} {
        tag = "${safeTag}";
        class functions {
            file = "${pboName}\\functions";
${allFunctions.map(f => `            class ${f.functionName} { postInit = 1; };`).join('\n')}
        };
    };
};
`;
  }

  return cpp;
};
