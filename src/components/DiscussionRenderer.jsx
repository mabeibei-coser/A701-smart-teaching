import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

/**
 * 讨论案例渲染器
 * 使用 Accordion 折叠面板展示三部分内容
 */
export default function DiscussionRenderer({ data, expandAll }) {
  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">案例数据为空</Typography>
      </Box>
    );
  }

  const { caseContent, referenceAnswer, keyPoints } = data;

  return (
    <Box sx={{
      '& .MuiTypography-body2': { fontSize: '0.95rem' },
      '& .MuiTypography-body1': { fontSize: '1.05rem' },
      '& .MuiTypography-caption': { fontSize: '0.8rem' },
      '& .MuiTypography-subtitle2': { fontSize: '0.95rem' },
      '& .MuiTypography-h6': { fontSize: '1.25rem' },
    }}>
      {/* ==================== 第一部分：讨论案例正文 ==================== */}
      <Accordion defaultExpanded sx={{ mb: 1.5 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              讨论案例正文
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {caseContent ? (
            <Box>
              {/* 标题 */}
              {caseContent.title && (
                <Typography variant="h6" sx={{ mb: 1.5, color: 'primary.dark', fontWeight: 700 }}>
                  {caseContent.title}
                </Typography>
              )}

              {/* 情境描述 */}
              {caseContent.scenario && (
                <Box sx={{ mb: 2, p: 2, bgcolor: '#FAFBFC', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    情境
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, lineHeight: 1.8 }}>
                    {caseContent.scenario}
                  </Typography>
                </Box>
              )}

              {/* 正反辩论：正反方立场 */}
              {(caseContent.affirmativePosition || caseContent.negativePosition) && (
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {caseContent.affirmativePosition && (
                    <Box sx={{ flex: 1, p: 1.5, bgcolor: '#E3F2FD', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark' }}>🟢 正方立场</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{caseContent.affirmativePosition}</Typography>
                    </Box>
                  )}
                  {caseContent.negativePosition && (
                    <Box sx={{ flex: 1, p: 1.5, bgcolor: '#FFEBEE', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#C62828' }}>🔴 反方立场</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{caseContent.negativePosition}</Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* 角色扮演：角色卡 */}
              {caseContent.roles && caseContent.roles.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>🎭 角色设定</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
                    {caseContent.roles.map((role, i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: '1 1 calc(50% - 12px)',
                          minWidth: 180,
                          p: 1.5,
                          bgcolor: '#F3E5F5',
                          borderRadius: 1.5,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {role.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {role.description}
                        </Typography>
                        {role.task && (
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500, display: 'block', mt: 0.5 }}>
                            📋 {role.task}
                          </Typography>
                        )}
                        {role.traits && role.traits.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {role.traits.map((t, j) => (
                              <Chip key={j} label={t} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 项目探究：探究问题与方法 */}
              {caseContent.inquiryQuestions && caseContent.inquiryQuestions.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>🔍 探究问题</Typography>
                  {caseContent.inquiryQuestions.map((q, i) => (
                    <Typography key={i} variant="body2" sx={{ pl: 1, mt: 0.5 }}>• {q}</Typography>
                  ))}
                </Box>
              )}
              {caseContent.methods && caseContent.methods.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>🛠️ 建议方法</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 0.5 }}>
                    {caseContent.methods.map((m, i) => (
                      <Chip key={i} label={m} size="small" variant="outlined" color="primary" />
                    ))}
                  </Box>
                </Box>
              )}

              {/* 问题解决：问题描述与约束 */}
              {caseContent.problemDescription && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#FFF8E1', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#F57F17' }}>⚠️ 问题描述</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{caseContent.problemDescription}</Typography>
                </Box>
              )}
              {caseContent.constraints && caseContent.constraints.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>约束条件</Typography>
                  {caseContent.constraints.map((c, i) => (
                    <Chip key={i} label={c} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                  ))}
                </Box>
              )}

              {/* 核心问题 */}
              {caseContent.coreQuestions && caseContent.coreQuestions.length > 0 && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#E3F2FD', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                    🎯 核心问题
                  </Typography>
                  {caseContent.coreQuestions.map((q, i) => (
                    <Typography key={i} variant="body2" sx={{ pl: 1, mt: 0.4, fontWeight: 500 }}>
                      {i + 1}. {q}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* 引导问题 */}
              {caseContent.guidingQuestions && caseContent.guidingQuestions.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    💬 引导问题
                  </Typography>
                  {caseContent.guidingQuestions.map((q, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.8, pl: 1 }}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </Box>
                      <Typography variant="body2">{q}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">暂无案例内容</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* ==================== 第二部分：参考答案 ==================== */}
      <Accordion defaultExpanded={expandAll} sx={{ mb: 1.5 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightbulbIcon sx={{ color: '#F57C00', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              参考答案
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {referenceAnswer && (referenceAnswer.coreArguments?.length || referenceAnswer.multiplePerspectives?.length || referenceAnswer.evaluationDimensions?.length) ? (
            <Box>
              {/* 核心论点 */}
              {referenceAnswer.coreArguments && referenceAnswer.coreArguments.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    📌 核心论点
                  </Typography>
                  {referenceAnswer.coreArguments.map((arg, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.6, pl: 1 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#F57C00',
                          mt: 0.8,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">{arg}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* 多种角度 */}
              {referenceAnswer.multiplePerspectives && referenceAnswer.multiplePerspectives.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    🔄 多种角度
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.8 }}>
                    {referenceAnswer.multiplePerspectives.map((persp, i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: '1 1 calc(50% - 8px)',
                          minWidth: 200,
                          p: 1.2,
                          bgcolor: '#FFF3E0',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#E65100' }}>
                          角度 {i + 1}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.3 }}>{persp}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 评分维度 */}
              {referenceAnswer.evaluationDimensions && referenceAnswer.evaluationDimensions.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    📊 评分维度
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 0.5 }}>
                    {referenceAnswer.evaluationDimensions.map((dim, i) => (
                      <Chip
                        key={i}
                        label={`${i + 1}. ${dim}`}
                        size="small"
                        sx={{ bgcolor: '#FFF8E1', color: '#F57F17' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">暂无参考答案</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* ==================== 第三部分：核心要点 ==================== */}
      <Accordion defaultExpanded={expandAll}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VpnKeyIcon sx={{ color: '#2E7D32', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              核心要点
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {keyPoints && (keyPoints.knowledgePoints?.length || keyPoints.teachingSuggestions?.length || keyPoints.extendedThinking?.length) ? (
            <Box>
              {/* 知识点 */}
              {keyPoints.knowledgePoints && keyPoints.knowledgePoints.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    📖 知识点
                  </Typography>
                  {keyPoints.knowledgePoints.map((kp, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.5, pl: 1 }}>
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#2E7D32',
                          mt: 0.8,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2">{kp}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* 教学建议 */}
              {keyPoints.teachingSuggestions && keyPoints.teachingSuggestions.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    💡 教学建议
                  </Typography>
                  {keyPoints.teachingSuggestions.map((ts, i) => (
                    <Typography key={i} variant="body2" sx={{ pl: 1, mt: 0.5 }}>
                      {i + 1}. {ts}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* 延伸思考 */}
              {keyPoints.extendedThinking && keyPoints.extendedThinking.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    🚀 延伸思考
                  </Typography>
                  <Box sx={{ p: 1.5, bgcolor: '#E8F5E9', borderRadius: 1, mt: 0.5 }}>
                    {keyPoints.extendedThinking.map((et, i) => (
                      <Typography key={i} variant="body2" sx={{ mb: 0.4 }}>
                        {i + 1}. {et}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">暂无核心要点</Typography>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
